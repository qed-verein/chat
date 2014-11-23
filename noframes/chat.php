<?php
$ignore_no_login = true;
$session_not_close = true;
require_once('common.php');
if(!userLoggedIn())
	redirect(urlLogin());

if(isset($_GET['layout']) && $_GET['layout'] == 'mobile')
	readfile('mobilelayout.html');
else (isset($_GET['layout']) && $_GET['layout'] == 'screen')
	readfile('screenlayout.html');
else
	redirect('https://chat.qed-verein.de/index.php?' . http_build_query(allOptions()));
?>
