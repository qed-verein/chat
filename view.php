<?php

//	mifritscher: erledige ich manuell
//	ignore_user_abort (false);
	ignore_user_abort (true);

	require ("data.php");
	require ("common.php");

	$type = @$_GET["type"];
	output_header ($type);
	output_prefix ($type);

	set_error_handler ('ErrorHandler');

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
	//trigger_error("socket gemacht ".socket_strerror(socket_last_error($socket))); 
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

		mysql_pconnect (SQL_HOST, SQL_USER, SQL_PASSWORD);
		mysql_select_db (SQL_DATABASE);
		$query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > $position" ); //" LIMIT $position,23432423");
		
		//trigger_error ("iiii".$position."####".mysql_num_rows($query));
		while ($array = mysql_fetch_assoc ($query))
		{
		
			//ZALGO-Workaround (sollte verbessert werden)
			//filter_var($array['name'], FILTER_SANITIZE_ENCODED);
			//$array['name'] = preg_replace("#[^A-Za-z0-9äöüÄÖÜáß ]#", "q", $array['name'] ); 
			//$array['name'] = preg_replace('/[^(\x20-\x7F)]*/','', $array['name']);
			//$array['name'] = quoted_printable_encode($array['name']);

			echo output_line ($type, $array);
			//print_r($array);
			//trigger_error(output_line ($type, $array));
			++$position;
		}
		mysql_close ();
	}

	$limit = $position + ((isset ($_GET["limit"]) && is_numeric ($_GET["limit"])) ? $_GET["limit"] : 256);
	//FF2 mag wohl nicht alle 100 ms was zu bekommen...
	//19 damit beim 1. Durclauf gleich was gesendet wird
	$zaehler=19;
	$zaehler2=0;
	while (!connection_aborted())
	{
		Check ($mem, $sem, $name, $position);
		//echo fehlt^^
		output_line($type,array('name' =>'a','id' =>3,'message' => 'a', 'date'=>'2342', 'ip' => 'a', 'delay'=>'2', 'bottag' =>0));
		//fcgi-Hack: Laufzeit begrenzen
		    $zaehler2++;

		flush();
		if ($position >= $limit)
			break;

		//mifritscher: damit php testen kann ob die verbindugn noch steht
		# socket_set_timeout($socket,1);
		//blocken ist hier aua, weil php in der Zeit nicht testen kann ob die verbindung noch da ist
		while (!connection_aborted()) {
		    $zaehler++;
		    $zaehler2++;
		    if($zaehler>=20) {
			echo "\n";
			flush ();
			$zaehler=0;
		    }
		if ($zaehler2 >100)
		    aufraeumen();
//		    if ($zaehler>=10)
//			exit;
		    $socket_status =@socket_recvfrom ($socket, $buffer, 4, 0, $source);
		    /* trigger_error('dddd'.$source);
		    if ($socket_status === -1)
			trigger_error("alles put ".socket_strerror(socket_last_error($socket)));  */
		    if ($socket_status > 0)
			break;
		    usleep(100000);
		}
	}
	aufraeumen();
	function aufraeumen () {
		echo "\n";
		global $socket;
		global $type;
		global $name;
		//trigger_error('verbindung weg');
		@socket_shutdown($socket);
		@socket_close($socket);
		@unlink($name);	
		output_suffix ($type);
		exit;
	}

?>
