<?php
chdir("noframes");
require_once("common.php");

if(!userLoggedIn())
	redirect(urlLogin(chatOptions()));
redirect(urlChat(chatOptions()));
?>
