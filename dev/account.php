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
	$pwhash = encryptedPassword($username, $password);
	$user = userByName($username);

	if(validPassword($user, $pwhash))
	{
		 $_SESSION['userid'] = $user['id'];
		 setcookie('userid', $userid, time() + (86400 * 30), "/");
		 setcookie('pwhash', $pwhash, time() + (86400 * 30), "/");
	}
	else $errorMessage = "Logindaten sind nicht gültig";
}
elseif(isset($_REQUEST['logout']))
{
	session_destroy();
	setcookie('userid', '', 1, "/");
	setcookie('pwhash', '', 1, "/");
	redirect(urlLogin());
}

if(!userLoggedIn())
{
	$content = renderLoginForm($errorMessage);
	echo renderSimpleLayout("Login", $content);
}
else redirect(urlChat());

?>
