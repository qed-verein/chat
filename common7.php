<?php

	function userhash($username, $password) {
		return sha1($username . $password);
	}

?>
