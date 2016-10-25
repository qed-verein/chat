<?php

if($_SERVER['SERVER_PORT'] == 31416)
{
	header('Location: /neu/chat.html?' . $_SERVER['QUERY_STRING']);
	exit(0);
}


$ignore_no_login = true;

require_once('common.php');

if(!userLoggedIn())
	redirect(urlLogin(chatOptions()));

$layout = uriParamString('layout', 'screen');
$frame = uriParamString('frame', '');

if($layout == 'mobile')
{
	$parts = array('mobile', 'receiver', 'send_mobile', 'settings', 'logs');
	require('template.php');
}
elseif($layout == 'screen')
{
	$parts = array('screen', 'receiver', 'send', 'settings', 'logs');
	require('template.php');
}
elseif($layout == 'frames')
{
	if(in_array($frame, array('receiver', 'send', 'settings', 'logs')))
	{
		$parts = array('frames', $frame);
		require('template.php');
	}
	else require('frames.html');
}
else die("Unbekanntes Layout");

?>
