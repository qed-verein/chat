<?php

	$handle = opendir ("sockets/");
	while ($file = readdir ($handle))
		if (!is_dir ($file) && file != "." && file != "..")
			unlink ("sockets/" . $file);

	echo "Ok!\n";

?>