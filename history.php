<?php

	require_once ("data.php");
	require_once ("common.php");
	
	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db (SQL_DATABASE);
	$botblocksql='';
	if (!empty($_GET['botblock']))
	    $botblocksql=' AND bottag=0';
	if (!empty($_GET['last']) && is_numeric($_GET['last']) &&$_GET["last"] > 0)
	{
		$count = get_query_value (mysql_query ("SELECT COUNT(*) FROM " . SQL_TABLE));
		$query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > ($count - " . $_GET["last"] . ")". $botblocksql);
	}
	else
	{
	    if (isset($_GET['from']) && ereg("^-?[0-9]+(_-?[0-9]+)*$",$_GET['from']))
		$from=$_GET['from'];
	    else
		$from="";
	    if (isset($_GET['to']) && ereg("^-?[0-9]+(_-?[0-9]+)*$",$_GET['to']))
		$to=$_GET['to'];
	    else
		$to="";
	    if (!empty($_GET['mode']) && $_GET["mode"] == "posts") {
	        $from = intval($from);
		$to = intval($to);
	    	$query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > " . $from . " && id <= " . $to. $botblocksql);
	    } else
		$query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE date >= \"" . get_date ($from) . "\" && date < \"" . get_date ($to) . "\"". $botblocksql);
	}
	if (SECURE_HISTORY)
	{
		if (mysql_num_rows ($query) > SECURE_HISTORY_MAX_POSTS || substr (getenv ("HTTP_USER_AGENT"), 0, 7) != "Mozilla")
		{
			header ("HTTP/1.1 403 Forbidden");
			echo "History-Abfragen allzu vieler Posts wurden aus Traffic-Gründen verboten.";
			die ();
		}
	}
		
	header ("Content-Type: text/html; charset=utf-8");

	if (isset ($_GET["type"]))
		$type = $_GET["type"];
	else
		$type = "html";

	if ($type == "html")
	{
		echo "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">\n"
			. "\n"
			. "<html>\n"
			. "\t<head>\n"
			. "\t\t<meta name=\"robots\" content=\"noindex, nofollow\">\n"
			. "\t\t<meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">\n"
			. "\t\t<meta http-equiv=\"cache-control\" content=\"no-cache\">\n"
			. "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"chat.css\">"
			. "\t\t<title>QED-Chat: Log</title>\n"
			. "\t</head>\n"
			. "\t<body>\n"
			. "\t\t<table>\n";
	}
	else if ($type == "xml")
	{
		echo "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
			. "<content>\n";
	}

	while ($array = mysql_fetch_assoc ($query)) {
		$coloredarray = $array;
		$coloredarray["color"] = get_color($array["name"]);
		//$coloredarray = applymods($coloredarray);
		
		if ($type == "html")
			echo "\t\t\t" . format_post ($coloredarray, $_GET) . "\n";
		else if ($type == "xml")
			echo "\t" . format_post_xml ($coloredarray) . "\n";
		else if ($type == "javascript")
			echo format_post_javascript ($coloredarray);
	}

	if ($type == "html")
	{
		echo "\t\t</table>\n"
			. "\t<a name=\"bottom\"> </a>\n"
			. "\t</body>\n"
			. "</html>";
	}
	else if ($type == "xml")
	{
		echo "</content>\n";
	}
	
?>
