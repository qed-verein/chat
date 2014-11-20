<?php

session_start();
date_default_timezone_set('Europe/Berlin');
ini_set('display_errors', '0');

if(empty($ignore_no_login) && empty($_SESSION['userid']))
	die("Du musst dich erst einloggen");

if(empty($session_not_close))
	session_write_close();

function htmlEscape($text)
{
	return htmlspecialchars($text, ENT_NOQUOTES);
}

function userAuthenticate($username, $password)
{
	mysql_connect(SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db(SQL_DATABASE);
	mysql_query('SET NAMES "utf8"');
	$pwhash = sha1($username . $password);

	$sql = sprintf("SELECT id FROM user WHERE username='%s' AND password='%s'",
		mysql_real_escape_string($username), mysql_real_escape_string($pwhash));
	$userid = @mysql_result(mysql_query($sql), 0, 0);

	if($userid)
		return $userid;
	else
		return null;
}

function userLoggedIn()
{
	return $_SESSION['userid'] != null;
}

function uriParamString($name, $default = null)
{
	if(!isset($_REQUEST[$name]))
	{
		if(is_null($default)) exit(sprintf("Fehler: Parameter %s fehlt", $name));
		else return $default;
	}

	return demagicalize_string($_REQUEST[$name]);
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
