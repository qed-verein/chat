<?php

	$refresh = is_numeric($_GET["refresh"]) ? $_GET["refresh"] : 5;
	header("Refresh: " . $refresh . "; url=" . $_SERVER['REQUEST_URI'] . "#bottom");
	
	require("history.php");

?>
