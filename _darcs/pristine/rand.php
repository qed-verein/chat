<?php

	require_once ("data.php");
	require_once ("common.php");

	header ("Content-Type: text/plain; charset=utf-8");
			
	srand (time ());
	
	$max = isset ($_GET["max"]) ? $_GET["max"] : 2 ;

	$post = array ("name" => "Ein Spieler",
				   "message" => "*hat ein Zufallsergebnis (1 bis " . $max . ") gemessen: " . rand (1, $max) . "*",
				   "ip" => getenv ("REMOTE_ADDR"),
				   "date" => date ("Y-m-d H-i-s"),
				   "delay" => "NULL");
	do_post ($post);;
	
?>