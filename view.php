<?php
//apache_setenv('no-gzip', 1);
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

$receivedPosts = false;
$firstCheck = true;

$chunk = "";

if (isset ($_GET["laghack"])) {
  for ($i = 0; $i < 1024*64; $i++) {
    $chunk = $chunk . ((rand(0, 1) == 0) ? " " : "\n");
  }
}

function xflush () {
  global $chunk;
  if (isset ($_GET["laghack"])) {
    echo $chunk;
  }
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
	  global $position, $type, $touchme, $receivedPosts, $firstCheck;

	  //var_dump (inotify_read($touchme));

	  if (inotify_read($touchme) !== FALSE) {

	    //mysql_pconnect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	    $query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > $position" ); //" LIMIT $position,23432423");

	    //trigger_error ("iiii".$position."####".mysql_num_rows($query));
	    while ($array = mysql_fetch_assoc ($query))
	      {
		if (! $firstCheck) $receivedPosts = true;
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
	  $firstCheck = false;
		//echo fehlt^^
	  //output_line($type,array('name' =>'a','id' =>3,'message' => 'a', 'date'=>'2342', 'ip' => 'a', 'delay'=>'2', 'bottag' =>0));
		//fcgi-Hack: Laufzeit begrenzen
	  $zaehler2++;

	  xflush();
	  if ($position >= $limit)
	    break;
	  $zaehler++;
	  $zaehler2++;
	  if($zaehler>=20) {
	    echo "\n";
	    xflush ();
	    $zaehler=0;
	  }
	  if ($zaehler2 >100)
	    aufraeumen();
	  
	  if ($receivedPosts)
	    aufraeumen();
	  usleep(100000);
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
