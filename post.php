<?php

require_once('common.php');

function ExceptionHandler($e)
{
	global $recorded;
	header("HTTP/1.1 503 Service unavailable");
	$text = sprintf("Fehler: %s\nIn Datei %s bei Zeile %d.\n",
		$e->getMessage(), $e->getFile(), $e->getLine());
	if($recorded)
		$text .= "Der Post konnte allerdings noch eingetragen werden.";
	else
		$text .= "Der Post konnte leider nicht eingetragen werden.";
	die($text);
}

$recorded = false;
set_exception_handler('ExceptionHandler');
ignore_user_abort(true);

versionCheck();
$post = array();
$post['name']    = uriParamString('name');
$post['message'] = uriParamString('message');
$post['channel'] = uriParamString('channel', '');
$post['date']    = date('Y-m-d H-i-s');
$post['ip']      = getenv('REMOTE_ADDR');
$post['userid']  = $_SESSION['userid'];
$post['delay']   = isset($_REQUEST['delay']) ? uriParamInteger('delay') : null;
$post['bottag']  = uriParamInteger('bottag', 0);

if(strlen($post['message']) > 10000)
	throw new Exception("Nachricht ist zu lang!");

/* TODO: Little Bobby Tables laesst gruessen ... - CSS */
$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD,
	 array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"));
$sql = sprintf("INSERT INTO %s (name, message, channel, date, ip, user_id, delay, bottag)" .
	"VALUES (:name, :message, :channel, :date, :ip, :user_id, :delay, :bottag)", SQL_TABLE);
$stm = $db->prepare($sql);
$stm->bindValue(':name',    $post['name'],    PDO::PARAM_STR);
$stm->bindValue(':message', $post['message'], PDO::PARAM_STR);
$stm->bindValue(':channel', $post['channel'], PDO::PARAM_STR);
$stm->bindValue(':date',    $post['date'],    PDO::PARAM_STR);
$stm->bindValue(':ip',      $post['ip'],      PDO::PARAM_STR);
$stm->bindValue(':user_id', $post['userid'],  PDO::PARAM_STR);
$stm->bindValue(':delay',   $post['delay'],   PDO::PARAM_INT);
$stm->bindValue(':bottag',  $post['bottag'],  PDO::PARAM_BOOL);
$stm->execute();
$recorded = true;

touch(TOUCH_FILE);

?>
