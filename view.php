<?php
@apache_setenv('no-gzip', 1);
//	mifritscher: erledige ich manuell
//	ignore_user_abort (false);
	ignore_user_abort (true);

	require ("data.php");
	require ("common.php");

        $touchme = inotify_init();
        $touchme_deleteme = inotify_add_watch ($touchme, TOUCH_FILE, IN_ATTRIB);
stream_set_blocking ($touchme, 0);
//var_dump ($touchme);
//var_dump ($touchme_deleteme);

touch (TOUCH_FILE);

	$type = @$_GET["type"];
	output_header ($type);
	output_prefix ($type);

	set_error_handler ('ErrorHandler');

function xflush () {
  echo str_repeat("\n",4096);
  flush();
  ob_flush();
}

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

/*
	$name = "sockets/" . uniqid ("s") . ".sock";
	$socket = socket_create (AF_UNIX, SOCK_DGRAM, 0);
	//trigger_error("socket gemacht ".socket_strerror(socket_last_error($socket))); 
	socket_set_nonblock($socket);
#	socket_set_block ($socket);
	socket_bind ($socket, $name);
#	socket_set_timeout($socket,1);
		
	$mem = shm_attach (MEM_SOCKETS_KEY, MEM_SOCKETS_SIZE);
	$sem = sem_get (SEM_SOCKETS_KEY); */

	if (isset ($_GET["feedback"]) && $_GET["feedback"])
		output_feedback ($type);

	function Check () {
	    //CSS, der sockets nicht mag
	    /*
	      global $mem, $sem, $name, $position, $type;

	      sem_acquire ($sem);
	      $listeners = @shm_get_var ($mem, MEM_SOCKETS_VAR);
	      if (!$listeners)
	      $listeners = array ();
	      array_push ($listeners, $name);
	      shm_put_var ($mem, MEM_SOCKETS_VAR, $listeners);
	      sem_release ($sem);
	    */
	  global $position, $type, $touchme;

	  //var_dump (inotify_read($touchme));

	  if (inotify_read($touchme) !== FALSE) {
	    
	    //mysql_pconnect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	    $query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > $position" ); //" LIMIT $position,23432423");
	    
	    //trigger_error ("iiii".$position."####".mysql_num_rows($query));
	    while ($array = mysql_fetch_assoc ($query))
	      {
		echo output_line ($type, $array);
		++$position;
	      }
	    xflush();
	    }
	}

	$limit = $position + ((isset ($_GET["limit"]) && is_numeric ($_GET["limit"])) ? $_GET["limit"] : 256);
	//FF2 mag wohl nicht alle 100 ms was zu bekommen...
	//19 damit beim 1. Durclauf gleich was gesendet wird
	$zaehler=19;
	$zaehler2=0;
	while (!connection_aborted())
	{
	  mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	  mysql_select_db (SQL_DATABASE);

	  Check ($position);
		//echo fehlt^^
		output_line($type,array('name' =>'a','id' =>3,'message' => 'a', 'date'=>'2342', 'ip' => 'a', 'delay'=>'2', 'bottag' =>0));
		//fcgi-Hack: Laufzeit begrenzen
		    $zaehler2++;

		xflush();
		if ($position >= $limit)
			break;

		//mifritscher: damit php testen kann ob die verbindugn noch steht
		//# socket_set_timeout($socket,1);
		//blocken ist hier aua, weil php in der Zeit nicht testen kann ob die verbindung noch da ist
		while (!connection_aborted()) {
		    $zaehler++;
		    $zaehler2++;
		    if($zaehler>=20) {
			echo "\n";
			xflush ();
			$zaehler=0;
		    }
		if ($zaehler2 >100)
		    aufraeumen();
//		    if ($zaehler>=10)
//			exit;
				//CSS, der sockets nicht mag
		/*
		    $socket_status =@socket_recvfrom ($socket, $buffer, 4, 0, $source);
		    /* trigger_error('dddd'.$source);
		    if ($socket_status === -1)
			trigger_error("alles put ".socket_strerror(socket_last_error($socket)));  * /
		    if ($socket_status > 0)
		    break;*/
		    usleep(100000);
		}
	}
	aufraeumen();
	function aufraeumen () {
		echo "\n";
		global $socket;
		global $type;
		global $name;
		global $touchme;
		global $touchme_deleteme;
		//trigger_error('verbindung weg');
		//CSS, der sockets nicht mag
		/*@socket_shutdown($socket);
		@socket_close($socket);
		@unlink($name);	
		output_suffix ($type);*/
		inotify_rm_watch($touchme, $touchme_deleteme);
		mysql_close ();
		exit;
	}

?>
