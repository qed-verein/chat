<?php

$ignore_no_login = true;
$session_not_close = true;

chdir("noframes");
require_once("common.php");

if(!userLoggedIn())
	redirect(urlLogin(chatOptions()));
redirect(urlChat(chatOptions()));
?>
