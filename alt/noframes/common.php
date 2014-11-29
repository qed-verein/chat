<?php

require_once('data.php');

session_start();

date_default_timezone_set('Europe/Berlin');
ini_set('display_errors', '0');


if(empty($ignore_no_login) && !userLoggedIn())
	die("Du musst dich erst einloggen");

if(empty($session_not_close))
	session_write_close();

function colorForName($name)
{
	$r = hexdec(substr(md5("a" . $name . "a"), -7)) % 156 + 100;
	$g = hexdec(substr(md5("b" . $name . "b"), -7)) % 156 + 100;
	$b = hexdec(substr(md5("c" . $name . "c"), -7)) % 156 + 100;
	return dechex($r) . dechex($g) . dechex($b);
}

function htmlEscape($text)
{
	return htmlspecialchars($text, ENT_NOQUOTES);
}

function databaseConnection()
{
	static $db = null;
	if(is_null($db)) $db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD,
		array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'"));
	return $db;
}

function userAuthenticate($username, $password)
{
	$db = databaseConnection();

	$pwhash = sha1($username . $password);
	$sql = "SELECT id FROM user WHERE username=:username AND password=:password";
	$stm = $db->prepare($sql);
	$stm->bindParam('username', $username, PDO::PARAM_STR);
	$stm->bindParam('password', $pwhash, PDO::PARAM_STR);
	$stm->execute();
	$userid = $stm->fetchColumn();

	if($userid)
		return $userid;
	else
		return null;
}

function userLoggedIn()
{
	return !empty($_SESSION['userid']);
}


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

function uriParamString($name, $default = null)
{
	if(!isset($_REQUEST[$name]))
	{
		if(is_null($default)) exit(sprintf("Fehler: Parameter %s fehlt", $name));
		else return $default;
	}

	return $_REQUEST[$name];
}

function uriParamInteger($name, $default = null)
{
	if(!isset($_REQUEST[$name]) || !is_numeric($_REQUEST[$name]))
	{
		if(is_null($default)) exit(sprintf("Fehler: Parameter %s fehlt", $name));
		else return $default;
	}

	return intval($_REQUEST[$name]);
}

function redirect($url)
{
	header('Location: ' . $url);
	exit;
}

function versionCheck()
{
	$version = uriParamString('version', '');
	if($version != CHAT_VERSION)
		throw new Exception("Der Chat-Client besitzt eine ungültige Versionsnummer. Bitte neuladen!");
}

function urlLogin($options = array()) {
	return 'https://chat.qed-verein.de/noframes/account.php?' .	http_build_query($options);}
function urlLogout() {
	return 'https://chat.qed-verein.de/noframes/account.php?logout=1';}
function urlChat($options = array()) {
	if(isset($options['layout']) && $options['layout'] == 'frames')
		return 'https://chat.qed-verein.de/frames/chat.php?' . http_build_query($options);
	else
		return 'https://chat.qed-verein.de/noframes/chat.php?' . http_build_query($options);
}

function chatOptions()
{
	$keys = array('channel', 'name', 'limit', 'wait', 'redirect', 'target', 'layout', 'skin',
		'last', 'botblock', 'old', 'ip', 'delay', 'links', 'title');
	$options = array();
	foreach($keys as $k)
		if(isset($_REQUEST[$k])) $options[$k] = $_REQUEST[$k];
	return $options;
}

?>
