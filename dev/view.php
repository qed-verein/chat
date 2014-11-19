<?php

chdir("..");
require_once('common.php');
require_once('data.php');

function jsonPost($post)
{
	$post['type'] = 'post';
	$post['color'] = get_color($post['name']);
	return json_encode($post) . "\n";
}

function jsonError($message, $file, $line)
{
	return json_encode(array('type' => 'error', 'description' => $message,
		'file' => $file, 'line' => $line)) . "\n";
}

function jsonAlive()
{
	return json_encode(array('type' => 'ok')) . "\n";
}

// Sende dem JavaScript ein Lebenszeichen
function signalAlive()
{
	global $keepalive;
	if($keepalive != 0)
	{
		echo jsonAlive();
		flush();
	}
}

// Warte bis jemand neue Nachrichten versendet
function waitForMessages()
{
	global $counter, $limit, $touchme, $keepalive;

	if($counter == $limit)
		return false;

	while(!connection_aborted())
	{
		$read = array($touchme); $write = $except = NULL;
		$timeout = $keepalive > 0 ? $keepalive : NULL;
		$changed = @stream_select($read, $write, $except, $timeout);
		if($changed === false) return false;
		if($changed > 0 && inotify_read($touchme) !== false) return true;
		signalAlive();
	}

	return false;
}


function ExceptionHandler($e)
{
	die(jsonError($e->getMessage(), $e->getFile(), $e->getLine()));
}

set_exception_handler('ExceptionHandler');

$position = uriParamInteger('position', -1);
$limit = uriParamInteger('limit', 256);
$channel = uriParamString('channel', '');
$version = uriParamString('version', '');
$keepalive = uriParamInteger('keepalive', 60);

if($version != CHAT_VERSION)
	throw new Exception("Der Chat-Client besitzt eine ungültige Versionsnummer.");

$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD);

if(!file_exists(TOUCH_FILE)) touch(TOUCH_FILE);
$touchme = inotify_init();
stream_set_blocking($touchme, false);
inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);

if($position <= 0)
{
	$sqlNextId = sprintf("SELECT id + 1 FROM %s WHERE channel = %s ORDER BY id DESC LIMIT %d, 1",
		SQL_TABLE, $db->quote($channel), -$position);
	$position = $db->query($sqlNextId)->fetchColumn();
}

header('Content-Type: text/plain; charset=utf-8');
$counter = 0;
$seconds = 0;

signalAlive();
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
