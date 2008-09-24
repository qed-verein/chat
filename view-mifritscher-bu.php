<?php

//	mifritscher: erledige ich manuell
//	ignore_user_abort (false);
	ignore_user_abort (true);

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
	
	$position = ((isset ($_GET["position"]) && is_numeric ($_GET["position"])) ? $_GET["position"] : -1);
	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db (SQL_DATABASE);
	$count = get_query_value (mysql_query ("SELECT COUNT(*) FROM " . SQL_TABLE));
	$position = ($position < 0 ? max (0, $count - 24) : min ($position, $count));
	mysql_close ();

	$name = "sockets/" . uniqid ("s") . ".sock";
	$socket = socket_create (AF_UNIX, SOCK_DGRAM, 0);
	socket_set_nonblock($socket);
#	socket_set_block ($socket);
	socket_bind ($socket, $name);
#	socket_set_timeout($socket,1);
		
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
	//FF2 mag wohl nicht alle 100 ms was zu bekommen...
	//19 damit beim 1. Durclauf gleich was gesendet wird
	$zaehler=19;
	while (!connection_aborted())
	{
		Check ($mem, $sem, $name, $position);
		flush();
		if ($position >= $limit)
			break;

		//mifritscher: damit php testen kann ob die verbindugn noch steht
		# socket_set_timeout($socket,1);
		//blocken ist hier aua, weil php in der Zeit nicht testen kann ob die verbindung noch da ist
		while (!connection_aborted()) {
		    $zaehler++;
		    if($zaehler>=20) {
			echo "\n";
			flush ();
			$zaehler=0;
		    }
		    $socket_status =@socket_recvfrom ($socket, $buffer, 4, 0, $source);
		    //if ($socket_status === -1)
			// die ("alles put ".socket_strerror(socket_last_error($socket))); 
		    if ($socket_status > 0)
			break;
		    usleep(100000);
		}
	}
	socket_shutdown($socket);
	socket_close($socket);
	unlink($name);	
	output_suffix ($type);

?>
