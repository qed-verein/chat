<?php

	ignore_user_abort (false);

	if (!isset ($_GET["url"]))
	{
		echo 'URL bitte in der Form "socket.php?url=host.endung/(optionaler spam)" eingeben.\"';
		die ();
	}

	header ("content-type: text/plain");

	$url = $_GET["url"];
	echo "URL: $url\n";

	$pos = strpos ($url, "/");
	if ($pos === false)
	{
		echo "URL ist ungültig (es fehlt ein \"/\" nach dem Hostname)\n";
		die ();
	}
	
	$address = substr ($url, 0, $pos);
	$location = substr ($url, $pos);
	
	$pos = strpos ($address, ":");
	if ($pos == false)
	{
		$host = $address;
		$port = 80;
	}
	else
	{
		$host = substr ($address, 0, $pos);
		$port = substr ($address, $pos + 1);
	}
	
	if (isset ($_GET["ip"]))
		$ip = $_GET["ip"];
	else
		$ip = gethostbyname ($host);
	
	echo "IP: $ip\n";
	echo "Port: $port\n";
	
	echo "\n";

	echo $header = "GET " . $location . " HTTP/1.1\r\nHost: $host\r\n\r\n";

	$s = socket_create (AF_INET, SOCK_STREAM, SOL_TCP);
	socket_connect ($s, $ip, $port);
	socket_send ($s, $header, strlen ($header), 0);
	socket_recv ($s, $result, 65536, 0);
	echo $result;

?>