<?php

//	"id" "name" "message" "date" "ip" "delay" "hollow" "color";
function zetaxmod($msg) {

   // $msg["message"] .= " (Post allowed by CIA)";


  
    if(($msg["ip"] == "66.96.233.190"))
			$msg["ip"] = "Anonyme Maus traut sich nicht raus..."; //"Pentakrat";


  if (($msg["name"] == "Christopher"))
			$msg["ip"] = "Der Zug mit der pflichtigen Reservation"; //"Pentakrat";



  if ($msg["ip"]=="84.56.117.43")
	$msg["ip"] = "Terrorist!";

  if ($msg["ip"]=="141.84.69.20")
	$msg["ip"] = "Spielleiter!";


  if ($msg["ip"]=="138.246.7.139")
	$msg["ip"] = "Seelenretter!";

  if ($msg["ip"]=="129.217.129.132")
{
	$msg["ip"] = "Mafia!";
	$msg["message"] = "...";
}

  

  if ($msg["name"] == "")
			$msg["ip"] = "N00B"; 


  if($msg["name"]=="BOFH")
  {
	$a = strpos($msg["message"],",");
	$msg["name"] =substr($msg["message"],0,$a);
	$msg["message"] = substr($msg["message"],$a+1);
	$a = strpos($msg["message"],",");
	if($a<30)
		{
    		   $msg["ip"] = substr($msg["message"],0,$a);
			$msg["message"] = substr($msg["message"],$a+1);
		}
	srand (hexdec (crc32 ($msg["name"])));
	$msg["color"] = dechex (rand (100, 255)) . dechex (rand (100, 255)) . dechex (rand (100, 255));

  }





  if(!(strpos(strtolower($msg["message"]),"mozart")==FALSE))
    $msg["message"]="Juhu, das Karnickel ist tot!";

  if(!(strpos(strtolower($msg["message"]),"harharhar")==FALSE))
    $msg["message"]="<-- harharhar-Noob";

  return $msg;
}

?>
