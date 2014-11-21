<?php

$ignore_no_login = true;
$session_not_close = true;

require_once('common.php');
require_once('layout.php');

$errorMessage = null;

if(isset($_REQUEST['login']))
{
	$username = uriParamString('username');
	$password = uriParamString('password');
	$userId = userAuthenticate($username, $password);

	if(!is_null($userId))
		$_SESSION['userid'] = $userId;
	else
		$errorMessage = "Logindaten sind nicht gültig";
}
elseif(isset($_REQUEST['logout']))
{
	session_destroy();
	redirect(urlLogin());
}

if(!userLoggedIn())
{
	$content = renderLoginForm($errorMessage);
	echo renderSimpleLayout("Login", $content);
}
else
{
	if(uriParamInteger('mobil', 0) == 1)
		redirect(urlChatMobile());
	else
		redirect(urlChat());
}


?>
