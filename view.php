<?php

ignore_user_abort(true);

require_once("data.php");
require_once("common.php");

$touchme = inotify_init();
inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);
stream_set_blocking($touchme, 0);
touch(TOUCH_FILE);

$type = uriParamString('type');
$position = uriParamInteger('position', -1);
$limit = uriParamInteger('limit', 256);
$channel = uriParamString('channel', '');

output_header($type);
output_prefix($type);

set_error_handler('ErrorHandler');

function ErrorHandler($number, $description, $file, $line)
{
	if (error_reporting() & $number)
	{
		global $type;
		output_error($type, $number, $description, $file, $line);
		exit();
	}
}

function keepAlive() {
    echo "\n";
    flushOutput();
}

function flushOutput() {
	flush();
	ob_flush();
}

mysql_connect(SQL_HOST, SQL_USER, SQL_PASSWORD);
mysql_select_db(SQL_DATABASE);

$count = get_query_value(mysql_query("SELECT MAX(id) FROM " . SQL_TABLE . " WHERE channel = \"" . mysql_real_escape_string($channel) . "\""));

$last24sql = sprintf("SELECT MIN(id) FROM (SELECT * FROM %s WHERE channel = \"%s\" ORDER BY id DESC LIMIT 0, 24) AS bla",
						SQL_TABLE, mysql_real_escape_string($channel));
$countm24 = get_query_value(mysql_query($last24sql));

$position = ($position < 0 ? $countm24 : min ($position, $count));

if (isset ($_GET["feedback"]) && $_GET["feedback"])
	output_feedback ($type);

function waitForMessages()
{
	global $keepAliveCounter, $timeoutCounter, $messageCounter, $touchme, $limit;

	while(!connection_aborted())
	{
		if(inotify_read($touchme) !== FALSE)
			return TRUE;

		$keepAliveCounter++;
		$timeoutCounter++;

		if($messageCounter >= $limit || $timeoutCounter > TIMEOUT_POLL_NUM)
			break;

		if($keepAliveCounter >= KEEP_ALIVE_NL_POLL_NUM) {
			keepAlive();
			$keepAliveCounter = 0;
		}

		usleep(POLL_MICROSECONDS);
	}

	return FALSE;
}


$keepAliveCounter = KEEP_ALIVE_NL_POLL_NUM - 1; //damit beim 1. Durchlauf gleich was gesendet wird
$timeoutCounter = 0;

while(waitForMessages())
{
	$sql = sprintf("SELECT * FROM %s WHERE id > %d AND channel = \"%s\"", SQL_TABLE, $position, mysql_real_escape_string($channel));
	$query = mysql_query($sql);
	while($array = mysql_fetch_assoc($query))
	{
		$position = $array["id"];
		echo output_line($type, $array);
	}
	flushOutput();
}

?>
