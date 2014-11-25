<?php
$ignore_no_login = true;
$session_not_close = true;
require_once('common.php');
if(!userLoggedIn())
	redirect(urlLogin(chatOptions()));

if(isset($_GET['layout']) && $_GET['layout'] == 'mobile')
	readfile('mobilelayout.html');
else
	readfile('screenlayout.html');
?>
