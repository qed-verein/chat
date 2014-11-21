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

$channel = uriParamString('channel', '');

$from = strtotime(uriParamString('from', ''));
$to = strtotime(uriParamString('to', ''));

if($to === false || $from === false)
	throw new Exception("Ungueltiges Datum.");
echo $to;
echo $to;

$sql = "SELECT * FROM %s WHERE date >= :from AND date <= :to AND channel = :channel LIMIT 0, 10000";

$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD);

$stm = $db->prepare($sql);
$stm->bindValue('channel', $channel, PDO::PARAM_STR);
$stm->bindValue('from', sqlTime($from), PDO::PARAM_STR);
$stm->bindValue('to', sqlTime($to), PDO::PARAM_STR);
$stm->execute();

while($row = $stm->fetch())
	echo jsonPost($row);

?>
