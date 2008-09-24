<?php

	declare(ticks = 1); // pcntl_signal() will das so.
	ignore_user_abort (false);

	require ("data.php");
	require ("common.php");

	function sig_handler ($sig) {
		switch($sig) {
			case SIGTERM:
				exit;
				break;
			case SIGUSR1:
				Check();
				flush();
				break;
			default:
		}
	}
	pcntl_signal(SIGTERM,"sig_handler");
	pcntl_signal(SIGUSR1,"sig_handler");
	
	$pid = posix_getpid();

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

	$mem = shm_attach (MEM_SOCKETS_KEY, MEM_SOCKETS_SIZE);
	$sem = sem_get (SEM_SOCKETS_KEY);

	if (isset ($_GET["feedback"]) && $_GET["feedback"])
		output_feedback ($type);

	function Check ()
	{
		global $mem, $sem, $name, $position, $type, $pid;

		sem_acquire ($sem);
		$listeners = @shm_get_var ($mem, MEM_PIDS_VAR);
		if (!$listeners)
			$listeners = array ();
		$listeners["$pid"] = 0;
		shm_put_var ($mem, MEM_PIDS_VAR, $listeners);
		sem_release ($sem);

		mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
		mysql_select_db (SQL_DATABASE);
		$query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > $position");
		while ($array = mysql_fetch_assoc ($query))
		{
			output_line ($type, $array, isset($_GET["unl33t"]));
			++$position;
		}
		mysql_close ();
	}

	$limit = $position + ((isset ($_GET["limit"]) && is_numeric ($_GET["limit"])) ? $_GET["limit"] : 256);

	posix_kill($pid,SIGUSR1);
	while (($position < $limit) && (connection_status() != 0)) {
		sleep(10);
	}
	output_suffix ($type);

?>
