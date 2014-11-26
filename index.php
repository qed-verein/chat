<?php
$ignore_no_login = true;
$session_not_close = true;

chdir("noframes");
require_once('common.php');

if(!userLoggedIn())
	redirect(urlLogin(chatOptions()));

if(isset($_GET['layout']) && $_GET['layout'] == 'frames')
	include('frames.html');
else if(isset($_GET['layout']) && $_GET['layout'] == 'mobile')
	include('mobile.html');
else
	include('screen.html');
?>
