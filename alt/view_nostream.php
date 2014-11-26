<?php

	ignore_user_abort (false);

	require ("data.php");
	require ("common.php");

	$type = $_GET["type"];
	output_header ($type);

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
	
	$position = ((isset ($_GET["position"]) && is_numeric ($_GET["position"])) ? $_GET["position"] : -1);
	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db (SQL_DATABASE);
	$count = get_query_value (mysql_query ("SELECT COUNT(*) FROM " . SQL_TABLE));
	$position = ($position < 0 ? max (0, $count - 24) : min ($position, $count));
	
	if ($count <= $position)
	{
		$name = "sockets/" . uniqid ("s") . ".sock";
		$socket = socket_create (AF_UNIX, SOCK_DGRAM, 0);
		socket_set_block ($socket);
		socket_bind ($socket, $name);

		$mem = shm_attach (MEM_SOCKETS_KEY, MEM_SOCKETS_SIZE);
		$sem = sem_get (SEM_SOCKETS_KEY);		

		while (true)
		{
			sem_acquire ($sem);
			$listeners = @shm_get_var ($mem, MEM_SOCKETS_VAR);
			if (!$listeners)
				$listeners = array ();
			array_push ($listeners, $name);
			shm_put_var ($mem, MEM_SOCKETS_VAR, $listeners);
			sem_release ($sem);
			
			if (get_query_value (mysql_query ("SELECT COUNT(*) FROM " . SQL_TABLE)) > $position)
				break;
			
			mysql_close ();	
			mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
			
			socket_recvfrom ($socket, $buffer, 4, 0, $source);

			mysql_select_db (SQL_DATABASE);
		}
	}
	
	$type = $_GET["type"];
	output_prefix ($type);

	$query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > $position");
	while ($array = mysql_fetch_assoc ($query))
		output_line ($type, $array);
		
	output_suffix ($type);

?>
