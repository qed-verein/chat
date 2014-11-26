<?php

//	mifritscher: erledige ich manuell
//	ignore_user_abort (false);
	ignore_user_abort (true);

	require ("data.php");
	require ("common.php");

	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db (SQL_DATABASE);
	$position=0;
	$res=mysql_query ("SELECT id FROM " . SQL_TABLE . " ORDER BY id");
	while ($data=mysql_fetch_assoc($res)) {
		mysql_query('UPDATE '. SQL_TABLE . ' SET id_neu='.++$position . ' WHERE id='.  $data['id']);
		if (mysql_errno())
		    die (mysql_error());
		if ($position % 10000 == 0)
			echo $position . "\n";
	}
?>
