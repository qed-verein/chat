<?php

ignore_user_abort (true);

require ("data.php");
require ("common.php");

$touchme = inotify_init();
$touchme_deleteme = inotify_add_watch ($touchme, TOUCH_FILE, IN_ATTRIB);
stream_set_blocking ($touchme, 0);
touch (TOUCH_FILE);

$type = @$_GET["type"];
output_header ($type);
output_prefix ($type);

set_error_handler ('ErrorHandler');

function keepAlive() {
	echo "\n";
	flushOutput();
}

function flushOutput () {
	flush();
	ob_flush();
}

function ErrorHandler ($number, $description, $file, $line)
{
	if (error_reporting () & $number)
	{
		global $type;
		output_error ($type, $number, $description, $file, $line);
		exit ();
	}
}

$position = ((isset ($_GET["position"]) && is_numeric ($_GET["position"])) ? $_GET["position"] : -1);
mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
mysql_select_db (SQL_DATABASE);
$count = get_query_value (mysql_query ("SELECT COUNT(*) FROM " . SQL_TABLE));
$position = ($position < 0 ? max (0, $count - 24) : min ($position, $count));
mysql_close ();

if (isset ($_GET["feedback"]) && $_GET["feedback"])
	output_feedback ($type);

function waitForMessages()
{
	global $keepAliveCounter, $timeoutCounter, $touchme;

	while(!connection_aborted())
	{
		if(inotify_read($touchme) !== FALSE)
			return TRUE;

		$keepAliveCounter++;
		$timeoutCounter++;

		if ($position >= $limit || $timeoutCounter > TIMEOUT_POLL_NUM)
			break;

		if($keepAliveCounter >= KEEP_ALIVE_NL_POLL_NUM) {
			keepAlive();
			$keepAliveCounter = 0;
		}

		usleep(POLL_MICROSECONDS);
	}

	return FALSE;
}

$limit = $position + ((isset ($_GET["limit"]) && is_numeric ($_GET["limit"])) ? $_GET["limit"] : 256);
$keepAliveCounter = KEEP_ALIVE_NL_POLL_NUM - 1; //damit beim 1. Durclauf gleich was gesendet wird
$timeoutCounter = 0;
mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
mysql_select_db (SQL_DATABASE);

while(waitForMessages())
{
	$sql = sprintf("SELECT * FROM %s WHERE id > %d", SQL_TABLE, $position);
	$query = mysql_query($sql);
	while($array = mysql_fetch_assoc($query))
	{
		echo output_line($type, $array);
		++$position;
	}

	flushOutput();
}

?>
