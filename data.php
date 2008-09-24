<?php

	//define ("GAME_FILE_CARDS", "cards_1337.txt");
	//define ("GAME_FILE_DISCARDED", "discarded.txt");
	//define ("GAME_FILE_TYPES", "types.txt");
	//define ("GAME_SEM", 1485);

    define ("MAX_PROTECTION", 0); // set this to 1 for |\/|4XXXXim41 pr0tection

    // SQL login and database information
    define ("SQL_HOST", "localhost:3306"); // host name
    define ("SQL_USER", "chat"); // user name
    define ("SQL_PASSWORD", "spam"); // user password
    define ("SQL_DATABASE", "spam"); // database name  (if changed init.php has to be called)
    define ("SQL_TABLE", "content"); // name of table to be used (if changed init.php has to be called)

    // shared memory parameters (do not change)
    define ("MEM_SOCKETS_KEY", 11337);
    define ("MEM_SOCKETS_SIZE", 16378);
    define ("MEM_SOCKETS_VAR", 23);
    define ("MEM_PIDS_VAR", 24);

    // semaphore ids, have to be unique (do not change)
    define ("SEM_SOCKETS_KEY", 1481);
    define ("SEM_POST_KEY", 1482); 
    define ("SEM_FLOOD_KEY", 1483);
    define ("SEM_SECURE_POSTS_KEY", 1484);
    
    // redirection parameters
    define ("URL_REDIRECT", "http://www.stud.uni-muenchen.de/~christian.sattler/redirect.html?"); // default redirection service (for hiding the referer [sic])
    
    // flooding protection parameters
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
?>
