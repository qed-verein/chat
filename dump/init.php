<?php

	require ("data.php");
	
	echo "test";
	
	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	echo "test";
	mysql_select_db (SQL_DATABASE);

	echo "test";
	echo mysql_query ("CREATE TABLE " . SQL_TABLE . " (id INT UNSIGNED NOT NULL AUTO_INCREMENT, date DATETIME NOT NULL, ip TINYTEXT NOT NULL, delay INT UNSIGNED, name TINYTEXT NOT NULL, message TEXT NOT NULL, PRIMARY KEY (id), INDEX (date));");
	
	echo "test";

	echo mysql_errno();
	echo mysql_error();
	
?>