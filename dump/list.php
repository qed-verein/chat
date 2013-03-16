<?php

	require_once ("data.php");

	$mem = shm_attach (MEM_SOCKETS_KEY, MEM_SOCKETS_SIZE);
	$sem = sem_get (SEM_SOCKETS_KEY);
	sem_acquire ($sem);
	$listeners = @shm_get_var ($mem, MEM_SOCKETS_VAR);
	sem_release ($sem);
	
	foreach ($listeners as $listener)
		echo $listener . "<br>\n";
	
?>