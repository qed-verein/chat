<?php

$ignore_no_login = true;
$session_not_close = true;
require_once('../data.php');
require_once('../common.php');
require_once('layout.php');

$errorMessage = null;

if(isset($_REQUEST['login']))
{
	$username = uriParamString('username');
	$password = uriParamString('password');
	$userId = userAuthenticate($username, $password);

	if(is_null($userId))
		$errorMessage = "Logindaten sind nicht gültig";
	else
	{
		$_SESSION['userid'] = $userId;
		redirect(urlChat());
	}
}
elseif(isset($_REQUEST['logout']))
{
	session_destroy();
	redirect(urlLogin());
}

$content = renderLoginForm($errorMessage);
echo renderSimpleLayout("Login", $content);

?>
