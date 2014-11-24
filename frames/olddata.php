<?php
	// Diese Datei ist veraltet und wird nur noch aus Kompabiltitätsgrunden für die Frame-Version beibehalten.
	// Die aktuelle Version befindet sich in noframes/data.php

    define ("MAX_PROTECTION", 0); // set this to 1 for |\/|4XXXXim41 pr0tection

    // SQL login and database information
    define ("SQL_HOST", "127.0.0.1:3306"); // host name
    define ("SQL_DATABASE", "spam"); // host name

    define ("OLD_SQL_TABLE", "content");

    // CSS, der sich nicht entscheiden kann
	//define("NOTIFICATION_METHOD", "inotify"); /* inotify, socket */
    //CSS, der sockets nicht mag
    //define ("TOUCH_FILE", "sockets/touchthis");
    //CSS, der Sockets doch ganz nett findet
    //define ("SOCKET_PATH", "unix:///tmp/chat.sock");

    // flooding protection parameters ... die scheinbar ignoriert werden - TODO
    define ("FLOOD", max (MAX_PROTECTION, 0)); // setting this to 1 activates flooding protection
    define ("FLOOD_FILE", "flood.txt"); // file to store POST requests
    define ("FLOOD_INTERVAL", 60); // in INTERVAL seconds ...
define ("FLOOD_MAX_POSTS", 10); // ... a maximum of MAX_POSTS is allowed

    // bot posting protection parameters
    define ("SECURE_POSTS", max (MAX_PROTECTION, 0)); // setting this to 1 activates bot protection using obscure javascript code
    define ("SECURE_POSTS_GENERATOR_FILE", "secure_posts_generator.txt"); // file used to store the generator index
    define ("SECURE_POSTS_KEYS_FILE", "secure_posts_keys.txt"); // file used to store keys
    define ("SECURE_POSTS_GENERATOR_NUM_USES", 1337); // minimum number of valid posts per generator

    // post length protection parameters
    define ("POST_LIMITS", max (MAX_PROTECTION, 0)); // setting this to 1 activates post format limitations
    define ("POST_LIMITS_MAX_LENGTH", 4096); // maximum number of character, 4096 is standard for ICQ
    define ("POST_LIMITS_MAX_LINES", 8); // maximum number of lines
    define ("POST_LIMITS_MAX_CONTIGUOS_NWSPS", 4096); // BUGGY, DO NOT CHANGE; maximum number of contiguos non-whitespace characters

    // history DOS protection, including preventing bots from accessing the history (bot recognition still n00bish - via user agent)
    define ("SECURE_HISTORY", max (MAX_PROTECTION, 0)); // setting this to 1 activates history DOS protection
    define ("SECURE_HISTORY_MAX_POSTS", 500); // maximum number of posts possible to retrieve

	// Timeouts
	define ("POLL_MICROSECONDS", 100000);
	define ("TIMEOUT_POLL_NUM",600);
	define ("KEEP_ALIVE_NL_POLL_NUM",50);


	// Übernehme die Einstellung des neues Chats
	require_once('../noframes/data.php');

?>