<?php

	ignore_user_abort (false);

	require ("data.php");
	require ("common.php");

	$type = $_GET["type"];
	output_header ($type);
	output_prefix ($type);

	set_error_handler (ErrorHandler);

	function ErrorHandler ($number, $description, $file, $line)
	{
		if (error_reporting () & $number)
		{
			global $type;
			output_error ($type, $number, $description, $file, $line);
			exit ();
		}
	}

	function shutdownfunc() {
		global $name;
		@unlink ($name);
	}
	
	$position = ((isset ($_GET["position"]) && is_numeric ($_GET["position"])) ? $_GET["position"] : -1);
	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db (SQL_DATABASE);
	$count = get_query_value (mysql_query ("SELECT COUNT(*) FROM " . SQL_TABLE));
	$position = ($position < 0 ? max (0, $count - 24) : min ($position, $count));
	mysql_close ();

	$name = "sockets/" . uniqid ("s") . ".sock";
	register_shutdown_function('shutdownfunc');

	$socket = socket_create (AF_UNIX, SOCK_DGRAM, 0);
	socket_set_block ($socket);
	socket_bind ($socket, $name);
		
	$mem = shm_attach (MEM_SOCKETS_KEY, MEM_SOCKETS_SIZE);
	$sem = sem_get (SEM_SOCKETS_KEY);

	if (isset ($_GET["feedback"]) && $_GET["feedback"])
		output_feedback ($type);

	function Check ()
	{
		global $mem, $sem, $name, $position, $type;

		sem_acquire ($sem);
		$listeners = @shm_get_var ($mem, MEM_SOCKETS_VAR);
		if (!$listeners)
			$listeners = array ();
		array_push ($listeners, $name);
		shm_put_var ($mem, MEM_SOCKETS_VAR, $listeners);
		sem_release ($sem);

		mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
		mysql_select_db (SQL_DATABASE);
		$query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > $position");
		while ($array = mysql_fetch_assoc ($query))
		{
			output_line ($type, $array, isset($_GET["unl33t"]) || getenv("HTTP_USER_AGENT") == "We are Xorg. Resistance is futile." || $_SERVER['REMOTE_ADDR'] == "134.2.62.65");
			++$position;
		}
		mysql_close ();
	}

	$limit = $position + ((isset ($_GET["limit"]) && is_numeric ($_GET["limit"])) ? $_GET["limit"] : 256);
	while (true)
	{
		Check ($mem, $sem, $name, $position);
		if ($position >= $limit)
			break;

		flush ();
		socket_recvfrom ($socket, $buffer, 4, 0, $source);
		if (connection_status() != 0) // vor socket_recvfrom wuerde
			break;		    // post.php blockieren...
	}
	
	output_suffix ($type);

?>
