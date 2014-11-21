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
$last = uriParamInteger('last', 100);
$from = strtotime(uriParamString('from', ''));
$to = strtotime(uriParamString('to', ''));

if($to === false || $from === false)
	throw new Exception("Ungueltiges Datum.");


$sql = sprintf("SELECT * FROM %s WHERE channel = :channel AND " .
	"date >= :from AND date <= :to  LIMIT 10000", SQL_TABLE);

$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD);
$stm = $db->prepare($sql);
$stm->bindValue('channel', $channel, PDO::PARAM_STR);
$stm->bindValue('from', sqlTime($from), PDO::PARAM_STR);
$stm->bindValue('to', sqlTime($to), PDO::PARAM_STR);
$stm->execute();

while($row = $stm->fetch())
	echo jsonPost($row);

?>
