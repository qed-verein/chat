<?php
$ignore_no_login = true;
$session_not_close = true;
require_once('../data.php');
require_once('../common.php');
if(!userLoggedIn())
	redirect(urlLogin());
if($_GET['mobile'] == 1)
	readfile('mobilelayout.html');
else
	readfile('screenlayout.html');
?>
