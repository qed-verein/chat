<?php

function userhash($username, $password) {
	return sha1($username . $password);
}

function myUrlSetOption ($opn, $val) {
	$myget = $_GET;
	$myget[$opn] = $val;
	return http_build_query($myget, "", "&amp;");
}

?>
