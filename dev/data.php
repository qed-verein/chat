<?php

    // SQL login and database information
    define('SQL_USER', 'chat'); // user name
    define('SQL_PASSWORD', 'spa!spa123'); // user password
    define('SQL_TABLE', 'content2'); // name of table to be used (if changed init.php has to be called)
    define('SQL_DSN', 'mysql:host=127.0.0.1;port=3306;dbname=spam'); // PDO Data Source Name

    define('TOUCH_FILE', '../sockets/touchthis');

	// Muss in der Javascript-Datei ebenfalls geändert werden
    define('CHAT_VERSION', '1413235752');

    // redirection parameters
    // default redirection service (for hiding the referer [sic])
    define('URL_REDIRECT', 'http://uxul.de/redirect.php?');

	// email of admins
	define('ADMIN_EMAIL', 'webmaster@qed-verein.de');

?>
