<?php

ignore_user_abort(true);

require_once("data.php");
require_once("common.php");

switch (NOTIFICATION_METHOD) {
case "inotify":
  $touchme = inotify_init();
  inotify_add_watch($touchme, TOUCH_FILE, IN_ATTRIB);
  //  stream_set_blocking($touchme, 0); da wir stream_select verwenden sollte das nicht mehr notwendig sein
  touch(TOUCH_FILE);
  break;
case "socket":
  $sock = stream_socket_client(SOCKET_PATH) or die;
  if (!$sock) exit(-1);
  break;
}

$type = uriParamString('type');
$position = uriParamInteger('position', -1);
$limit = uriParamInteger('limit', 256);
$channel = uriParamString('channel', '');

output_header($type);
output_prefix($type);

set_error_handler('ErrorHandler');

function ErrorHandler($number, $description, $file, $line)
{
	if (error_reporting() & $number)
	{
		global $type;
		output_error($type, $number, $description, $file, $line);
		exit();
	}
}

function keepAlive() {
    //echo "\n";
    global $type;
    output_feedback($type);
    flushOutput();
}

function flushOutput() {
	flush();
	ob_flush();
}


mysql_connect(SQL_HOST, SQL_USER, SQL_PASSWORD);
mysql_select_db(SQL_DATABASE);

$sqlNextId = sprintf("SELECT MAX(id) + 1 FROM %s WHERE channel = '%s'",
	SQL_TABLE, mysql_real_escape_string($channel));
$nextId = mysql_fetch_array(mysql_query($sqlNextId));
if($position <= 0) $position += $nextId;

if (isset ($_GET["feedback"]) && $_GET["feedback"])
	output_feedback ($type);

$firsttime_hack = true;

function waitForMessages()
{
  global $keepAliveCounter, $timeoutCounter, $messageCounter, $sock, $touchme, $limit, $firsttime_hack;

  if ($firsttime_hack) return TRUE;

  $keepAlives = 0;

  switch (NOTIFICATION_METHOD) {
  case "inotify":
    while(!connection_aborted()) {
      if ($messageCounter >= $limit) return FALSE;

      $read = array($touchme);
      $write = NULL;
      $except = NULL;
      if (false === ($num_changed_streams = stream_select($read, $write, $except, 30))) {
	// TODO: error.
      } else if ($num_changed_streams > 0) {
	if(inotify_read($touchme) !== FALSE)
	  return TRUE;
      } else {
	$keepAlives++;
	if ($keepAlives > 60) return FALSE;
	keepAlive();
      }
    }
    break;
  case "socket":
    while(!connection_aborted()) {
      $read = array($sock);
      $write = NULL;
      $except = array($sock);
      if (false === ($num_changed_streams = stream_select($read, $write, $except, 30))) {
	echo("select_stream ging nicht");
	exit(-1);
      } else if ($num_changed_streams > 0) {
	if (count($except) > 0) {
	  return FALSE;
	}
	if(fread($sock, 1) !== FALSE) return TRUE;
      } else {
	$keepAlives++;
	if ($keepAlives > 60) return FALSE;
	keepAlive();
      }
    }
  }

  /* while(!connection_aborted()) */
  /* 	{ */
  /* 	  switch (NOTIFICATION_METHOD) { */
  /* 	  case "inotify": */
  /* 	    $read = array($touchme); */
  /* 	    $write = NULL; */
  /* 	    $except = NULL; */
  /* 	    if (false === ($num_changed_streams = stream_select($read, $write, $except, 0, POLL_MICROSECONDS))) { */
  /* 	      // TODO: error. */
  /* 	    } else if ($num_changed_streams > 0) { */
  /* 	      if(inotify_read($touchme) !== FALSE) */
  /* 		return TRUE; */
  /* 	    } */
  /* 	    break; */
  /* 	  case "socket": */
  /* 	    $read = array($sock); */
  /* 	    $write = NULL; */
  /* 	    $except = NULL; */
  /* 	    if (false === ($num_changed_streams = stream_select($read, $write, $except, 0, POLL_MICROSECONDS))) { */
  /* 	      // TODO: error. */
  /* 	    } */
  /* 	    if (fgets($sock, 1) !== FALSE) return TRUE; */


  /* 		$keepAliveCounter++; */
  /* 		$timeoutCounter++; */

  /* 		if($messageCounter >= $limit || $timeoutCounter > TIMEOUT_POLL_NUM) */
  /* 			break; */

  /* 		if($keepAliveCounter >= KEEP_ALIVE_NL_POLL_NUM) { */
  /* 			keepAlive(); */
  /* 			$keepAliveCounter = 0; */
  /* 		} */
  /* 	  } */
  /* 		//usleep(POLL_MICROSECONDS); */
  /* 	} */

	return FALSE;
}


$keepAliveCounter = KEEP_ALIVE_NL_POLL_NUM - 1; //damit beim 1. Durchlauf gleich was gesendet wird
$timeoutCounter = 0;
$messageCounter = 0;


while(waitForMessages())
{
	$sql = sprintf("SELECT * FROM %s WHERE id > %d AND channel = \"%s\" LIMIT 0, %d", SQL_TABLE, $position, mysql_real_escape_string($channel), $limit - $messageCounter);
	$query = mysql_query($sql);
	while($array = mysql_fetch_assoc($query))
	{
		$messageCounter++;
		$position = $array["id"];
		echo output_line($type, $array);
	}
	flushOutput();
}

output_suffix($type);

?>
