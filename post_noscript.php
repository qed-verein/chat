<?php

	if (isset($_POST["message"]))
		require_once("post.php");

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html style="height: 100%; margin: 0; padding: 0; border: none;">

	<head>
		<meta name="robots" content="noindex, nofollow">
		<meta http-equiv="content-type" content="text/html; charset=UTF-8">
		<link rel="stylesheet" type="text/css" href="chat.css">
		<title>Sendefenster</title>
	</head>

	<body style="height: 100%; margin: 0; padding: 0; border: none;">
		<form method="POST" action="post_noscript.php">
			<table style="height: 99%; width: 99%; margin: 0 auto; padding: 0; border: none;">
				<tr><td>Name:</td><td><input name="name" class="text" style="width:100%;" value="<?php 
				if (isset($_GET["name"])) {
				   echo addslashes($_GET["name"]);
				} else if (isset($_POST["name"])) {
				     echo addslashes($_POST["name"]);
				}
				?>"></td></tr>
				<tr><td>Text:</td><td style="height:100%; width:100%;"><textarea name="message" class="text" rows="4" style="width:100%; height:100%;"></textarea></td></tr>
				<tr><td><input type="submit" value="senden"></tr>
			</table>
		</form>
	</body>

</html>