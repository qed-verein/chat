<?php

ignore_user_abort (true);

require_once("data.php");
require_once("common.php");

$touchme = inotify_init();
inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);
stream_set_blocking($touchme, 0);
touch(TOUCH_FILE);

$type = @$_GET["type"];
output_header($type);
output_prefix($type);

set_error_handler('ErrorHandler');

$receivedPosts = false;
$firstCheck = true;

function xflush () {
	flush();
	ob_flush();
}

function ErrorHandler ($number, $description, $file, $line)
{
	if (error_reporting () & $number)
	{
		global $type;
		output_error ($type, $number, $description, $file, $line);
		exit ();
	}
}

$position = ((isset ($_GET["position"]) && is_numeric ($_GET["position"])) ? $_GET["position"] : -1);
mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
mysql_select_db (SQL_DATABASE);
$count = get_query_value (mysql_query ("SELECT COUNT(*) FROM " . SQL_TABLE));
$position = ($position < 0 ? max (0, $count - 24) : min ($position, $count));
mysql_close ();

if (isset ($_GET["feedback"]) && $_GET["feedback"])
	output_feedback ($type);

function Check () {
  global $position, $type, $touchme, $receivedPosts, $firstCheck;
  if (inotify_read($touchme) !== FALSE) {
    $query = mysql_query ("SELECT * FROM " . SQL_TABLE . " WHERE id > $position" );
    while ($array = mysql_fetch_assoc ($query))
      {
	if ($firstCheck) {}
	else {$receivedPosts = true;}
	echo output_line ($type, $array);
	++$position;
      }
    xflush();
    }
}

$limit = $position + ((isset ($_GET["limit"]) && is_numeric ($_GET["limit"])) ? $_GET["limit"] : 256);
$zaehler= KEEP_ALIVE_NL_POLL_NUM - 1; //damit beim 1. Durclauf gleich was gesendet wird
$zaehler2=0;
	mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
	mysql_select_db (SQL_DATABASE);
while (!connection_aborted())
{
  Check ($position);
  $firstCheck = false;
  //Laufzeit begrenzen, keep-alive
  $zaehler++;
  $zaehler2++;

  xflush();
  if (($position >= $limit) ||
      ($zaehler2 > TIMEOUT_POLL_NUM) ||
      ($receivedPosts)) break;
  if($zaehler>=KEEP_ALIVE_NL_POLL_NUM) {
    echo "\n";
    xflush ();
    $zaehler=0;
  }
  usleep(POLL_MICROSECONDS);
}
?>
