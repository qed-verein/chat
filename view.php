<?php

ignore_user_abort(true);

require("data.php");
require("common.php");

$touchme = inotify_init();
inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);
stream_set_blocking($touchme, 0);
touch(TOUCH_FILE);

$type = uriParamString('type');
$position = uriParamInteger('position', -1);
$limit = uriParamInteger('limit', 256);

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

function flushOutput () {
	flush();
	ob_flush();
}


mysql_connect(SQL_HOST, SQL_USER, SQL_PASSWORD);
mysql_select_db(SQL_DATABASE);

$count = get_query_value(mysql_query(sprintf("SELECT COUNT(*) FROM %s", SQL_TABLE)));
$position = ($position < 0 ? max(0, $count - 24) : min($position, $count));

function waitForMessages()
{
	global $keepAliveCounter, $timeoutCounter, $touchme, $nextPosition, $limit;

	while(!connection_aborted())
	{
		if(inotify_read($touchme) !== FALSE)
			return TRUE;

		$keepAliveCounter++;
		$timeoutCounter++;

		if ($nextPosition >= $position + $limit || $timeoutCounter > TIMEOUT_POLL_NUM)
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
$nextPosition = $position;

while(waitForMessages())
{
	$sql = sprintf("SELECT * FROM %s WHERE id >= %d", SQL_TABLE, $nextPosition);
	$query = mysql_query($sql);
	while($array = mysql_fetch_assoc($query))
	{
		echo output_line($type, $array);
		$nextPosition = intval($array["id"]) + 1;
	}

	flushOutput();
}

?>
