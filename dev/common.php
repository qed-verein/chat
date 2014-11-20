<?php

require_once('data.php');

session_start();
date_default_timezone_set('Europe/Berlin');
//ini_set('display_errors', '0');

authenticateWithCookie();

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


function encryptedPassword($username, $password)
{
	return sha1($username + $password);
}

function validPassword($user, $password)
{
	if(!preg_match('/^[0-9a-f]{40}$/', $user['password'])) return false;
	return $user['password'] === $password;
}

function authenticateWithCookie()
{
	if(isset($_COOKIE['userid']) && isset($_COOKIE['pwhash']))
	{
		$user = userByIdentifier($_COOKIE['userid']);
		if(validPassword($user, $_COOKIE['pwhash']))
			$_SESSION['userid'] = $user['id'];
	}
}

function userByName($username)
{
	$db = databaseConnection();
	$sql = "SELECT * FROM user WHERE username=:username";
	$stm = $db->prepare($sql);
	$stm->bindParam('username', $username, PDO::PARAM_STR);
	$stm->execute();
	return $stm->fetch();
}

function userByIdentifier($userid)
{
	$db = databaseConnection();
	$sql = "SELECT * FROM user WHERE id=:userid";
	$stm = $db->prepare($sql);
	$stm->bindParam('userid', $userid, PDO::PARAM_INT);
	$stm->execute();
	return $stm->fetch();
}

//function userAuthenticate($username, $password)
//{
	//$db = new PDO(SQL_DSN, SQL_USER, SQL_PASSWORD,
		//array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8'"));

	//$pwhash = sha1($username . $password);
	//$sql = "SELECT id FROM user WHERE username=:username AND password=:password";
	//$stm = $db->prepare($sql);
	//$stm->bindParam('username', $username, PDO::PARAM_STR);
	//$stm->bindParam('password', $pwhash, PDO::PARAM_STR);
	//$stm->execute();
	//$userid = $stm->fetchColumn();

	//if($userid)
		//return $userid;
	//else
		//return null;
//}

function userLoggedIn()
{
	return !empty($_SESSION['userid']);
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

function urlLogin() {
	return 'https://chat.qed-verein.de/dev/account.php';}
function urlLogout() {
	return 'https://chat.qed-verein.de/dev/account.php?logout=1';}
function urlChat() {
	return 'https://chat.qed-verein.de/index.php';}

?>
