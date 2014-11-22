<?php
$ignore_no_login = true;
$session_not_close = true;
require_once('common.php');
if(!userLoggedIn())
	redirect(urlLogin());
if(!isset($_GET['mobile']) || $_GET['mobile'] == 1)
	readfile('mobilelayout.html');
else
	readfile('screenlayout.html');
?>
