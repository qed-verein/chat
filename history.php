<?php

require_once('common.php');

function sqlTime($time)
{
	return date("Y-m-d H:i:s", $time);
}

function ExceptionHandler($e)
{
	die(jsonError($e->getMessage(), $e->getFile(), $e->getLine()));
}

set_exception_handler('ExceptionHandler');
versionCheck();

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');

$channel = uriParamString('channel', '');
$last = uriParamInteger('last', 100);
$from = strtotime(uriParamString('from', ''));
$to = strtotime(uriParamString('to', ''));

$mode = isset($_REQUEST['last']) ? 'last' : 'date';
if(isset($_REQUEST['last']) && $_REQUEST['last'] == 'own') $mode = 'post';

if($mode == 'date' && ($to === false || $from === false))
	throw new Exception("Datum konnte nicht erkannt werden.");
if($mode == 'last' && $last > 10000)
	throw new Exception("Es wurden zu viele Posts angefragt.");

$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD,
	 array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"));

if($mode == 'date')
{
	$sql = sprintf("SELECT * FROM %s WHERE channel = :channel AND " .
		"date >= :from AND date <= :to ORDER BY id LIMIT 10000", SQL_TABLE);
	$stm = $db->prepare($sql);
	$stm->bindValue('channel', $channel, PDO::PARAM_STR);
	$stm->bindValue('from', sqlTime($from), PDO::PARAM_STR);
	$stm->bindValue('to', sqlTime($to), PDO::PARAM_STR);
	$stm->execute();
}
else if($mode == 'last')
{
	$sqlFrom = sprintf("SELECT MIN(id) AS id FROM (SELECT id FROM %s WHERE channel = :channel " .
		"ORDER BY id DESC LIMIT :last) AS tmp", SQL_TABLE);
	$stm = $db->prepare($sqlFrom);
	$stm->bindValue('channel', $channel, PDO::PARAM_STR);
	$stm->bindValue('last', $last, PDO::PARAM_INT);
	$stm->execute();
	$from = $stm->fetchColumn();
	if($from === FALSE) exit();

	$sql = sprintf("SELECT * FROM %s WHERE channel = :channel " .
		" AND id >= :from ORDER BY id", SQL_TABLE);
	$stm = $db->prepare($sql);
	$stm->bindValue('channel', $channel, PDO::PARAM_STR);
	$stm->bindValue('from', $from, PDO::PARAM_INT);
	$stm->execute();
}
else if($mode =='post')
{
	$sqlFrom = sprintf("SELECT MAX(id) FROM %s WHERE channel = :channel AND user_id = :user_id", SQL_TABLE);
	$stm = $db->prepare($sqlFrom);
	$stm->bindValue('channel', $channel, PDO::PARAM_STR);
	$stm->bindValue('user_id',$GLOBALS['userid'], PDO::PARAM_STR);
	$stm->execute();
	$from = $stm->fetchColumn();
	if($from === FALSE) exit();

	$sql = sprintf("SELECT * FROM %s WHERE channel = :channel " .
		" AND id >= :from ORDER BY id LIMIT 10000", SQL_TABLE);
	$stm = $db->prepare($sql);
	$stm->bindValue('channel', $channel, PDO::PARAM_STR);
	$stm->bindValue('from', $from, PDO::PARAM_INT);
	$stm->execute();
}
while($row = $stm->fetch(PDO::FETCH_ASSOC))
	echo jsonPost($row);

?>
