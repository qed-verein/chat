<?php

require_once('common.php');

function jsonPost($post)
{
	$post['type'] = 'post';
	$post['color'] = colorForName($post['name']);
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

versionCheck();
$position = uriParamInteger('position', -1);
$limit = uriParamInteger('limit', 256);
$channel = uriParamString('channel', '');
$keepalive = uriParamInteger('keepalive', 60);

if(!file_exists(TOUCH_FILE)) touch(TOUCH_FILE);
$touchme = inotify_init();
stream_set_blocking($touchme, false);
inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);

$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD);

if($position <= 0)
{
	$sqlNextId = sprintf("SELECT id + 1 FROM %s WHERE channel = :channel " .
		"ORDER BY id DESC LIMIT :last, 1", SQL_TABLE);
	$stm = $db->prepare($sqlNextId);
	$stm->bindValue('channel', $channel, PDO::PARAM_STR);
	$stm->bindValue('last', -$position, PDO::PARAM_INT);
	$stm->execute();
	$position = $stm->fetchColumn();
}

header('Content-Type: text/plain; charset=utf-8');
$counter = 0;

signalAlive();
do
{
	$sql = sprintf("SELECT * FROM %s WHERE id >= :id AND channel = :channel " .
		"ORDER BY id LIMIT :limit",	SQL_TABLE);
	$stm = $db->prepare($sql);
	$stm->bindValue('id', $position, PDO::PARAM_INT);
	$stm->bindValue('channel', $channel, PDO::PARAM_STR);
	$stm->bindValue('limit', $limit - $counter, PDO::PARAM_INT);
	$stm->execute();
	while($row = $stm->fetch())
	{
		++$counter;
		$position = $row['id'] + 1;
		echo jsonPost($row);
	}
	flush();
}
while(waitForMessages());

?>
