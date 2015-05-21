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
	{
		//$_SESSION['userid'] = $userId;
		setcookie('userid', $userId, strtotime("+1 month"));
		setcookie('pwhash', sha1($username . $password), strtotime("+1 month"));
		$GLOBALS['userid'] = $userId;
	}
	else
		$errorMessage = "Logindaten sind nicht gültig";
}
elseif(isset($_REQUEST['logout']))
{
	//session_destroy();
	setcookie('userid', '', strtotime("-1 day"));
	setcookie('pwhash', '', strtotime("-1 day"));
	redirect(urlLogin());
}

if(userLoggedIn())
	redirect(urlChat(chatOptions()));
else
{
	$content = renderLoginForm(chatOptions(), $errorMessage);
	echo renderSimpleLayout("Login", $content);
}

?>
