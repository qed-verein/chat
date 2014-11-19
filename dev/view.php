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
	$post['color'] = get_color($post['name']);
	return json_encode($post) . "\n";
}

function jsonAlive()
{
	return json_encode(array('type' => 'ok')) . "\n";
}

function ExceptionHandler($e)
{
	echo jsonError($e->getMessage(), $e->getFile(), $e->getLine());
}

function waitForMessages()
{
	global $counter, $limit, $touchme, $feedback, $type;

	if($counter >= $limit) return false;
	for($time = 0; $time <= 300; ++$time)
	{
		$read = array($touchme); $write = $except = NULL;
		$changed = stream_select($read, $write, $except, 1);
		if($changed === false) throw new Exception('Fehler bei stream_select.');
		if($changed > 0) return true;
		if($feedback > 0 && $time % $feedback == 0)
			echo jsonAlive();
	}
}


$position = uriParamInteger('position', -1);
$limit = uriParamInteger('limit', 256);
$channel = uriParamString('channel', '');
$version = uriParamString('version', '');
$feedback = uriParamInteger('feedback', 60);

ignore_user_abort(false);
$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD);

touch(TOUCH_FILE);
$touchme = inotify_init();
inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);

if($position <= 0)
{
	$sqlNextId = sprintf("SELECT id + 1 FROM %s WHERE channel = %s ORDER BY id DESC LIMIT %d, 1",
		SQL_TABLE, $db->quote($channel), -$position);
	echo $sqlNextId;
	$position = $db->query($sqlNextId)->fetchColumn();
}



set_exception_handler('ExceptionHandler');
if($version != CHAT_VERSION)
	throw new Exception("Der Chat-Client benützt eine ungültige Versionsnummer. Bitte Fenster neuladen.");

header('Content-Type: text/plain; charset=utf-8');
if($feedback > 0) echo jsonAlive();
$counter = 0;


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
