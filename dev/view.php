<?php

chdir("..");
require_once('common.php');
require_once('data.php');

function jsonError($message, $file, $line)
{
	return json_encode(array('type' => 'error', 'description' => $message,
		'file' => $file, 'line' => $line)) . "\n";
}

function jsonPost($post)
{
	$post['type'] = 'post';
	$post['color'] = get_color($post['name']);
	return json_encode($post) . "\n";
}

function jsonAlive($seconds = 0)
{
	return json_encode(array('type' => 'ok', 'seconds' => $seconds)) . "\n";
}

function ExceptionHandler($e)
{
	echo jsonError($e->getMessage(), $e->getFile(), $e->getLine());
}
set_exception_handler('ExceptionHandler');

//function ErrorHandler($errno, $errstr, $errfile, $errline)
//{
    //throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
//}
//set_error_handler('ErrorHandler', );

function keepAliveSignal()
{
	global $seconds, $keepalive;
	if($keepalive > 0 && $seconds % $keepalive == 0)
	{
		++$seconds;
		echo jsonAlive($seconds);
		flush();
	}
}

function waitForMessages()
{
	global $counter, $limit, $touchme, $seconds;

	if($counter == $limit)
		return false;

	while(!connection_aborted())
	{
		$read = array($touchme); $write = $except = NULL;
		$changed = stream_select($read, $write, $except, 60);
		echo jsonAlive("A" . $changed . "-" . strftime("%X"));
		if($changed === false) return false;
		echo jsonAlive("B" . $changed . "-" . strftime("%X"));
		if($changed > 0 && inotify_read($touchme) !== false) return true;
		echo jsonAlive("C" . $changed . "-" . strftime("%X"));
		keepAliveSignal();
	}

	return false;
}

$position = uriParamInteger('position', -1);
$limit = uriParamInteger('limit', 256);
$channel = uriParamString('channel', '');
$version = uriParamString('version', '');
$keepalive = uriParamInteger('keepalive', 60);

$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD);

touch(TOUCH_FILE);
$touchme = inotify_init();
stream_set_blocking($touchme, false);
inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);

if($position <= 0)
{
	$sqlNextId = sprintf("SELECT id + 1 FROM %s WHERE channel = %s ORDER BY id DESC LIMIT %d, 1",
		SQL_TABLE, $db->quote($channel), -$position);
	$position = $db->query($sqlNextId)->fetchColumn();
}



if($version != CHAT_VERSION)
	throw new Exception("Der Chat-Client benützt eine ungültige Versionsnummer. Bitte Fenster neuladen.");

header('Content-Type: text/plain; charset=utf-8');
$counter = 0;
$seconds = 0;

keepAliveSignal();
do
{
	$sql = sprintf("SELECT * FROM %s WHERE id >= %d AND channel = %s LIMIT 0, %d",
		SQL_TABLE, $position, $db->quote($channel), $limit - $counter);
	$res = $db->query($sql);
	while($row = $res->fetch())
	{
		++$counter;
		$position = $row['id'] + 1;
		echo jsonPost($row);
	}
	flush();
}
while(waitForMessages());

?>
