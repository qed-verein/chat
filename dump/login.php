<?php

// login procedure. must return 0 if not successfull, and a positive userid otherwise.
function do_login ($username, $password) {
	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db (SQL_DATABASE);
	$pw=userhash($username, $password);
	$user=mysql_real_escape_string($username);
	mysql_query('SET NAMES "utf8"');
	$userid=@mysql_result(mysql_query('SELECT id FROM user WHERE username="'.$user.'" AND password="'.$pw.'"'),0,0);
	if ($userid) {
		return $userid;
	} else {
		return 0;
	}
}

?>
