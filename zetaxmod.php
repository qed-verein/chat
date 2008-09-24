<?php

//	"id" "name" "message" "date" "ip" "delay" "hollow" "color";
function zetaxmod($msg) {

  
 /* if(!(strpos(strtolower($msg["message"]),"mozart")==FALSE))
    $msg["message"]="Juhu, das Karnickel ist tot!";

 /* if(!(strpos(strtolower($msg["message"]),"harharhar")==FALSE))
    $msg["message"]="<-- harharhar-Noob";

  if(($msg["name"]=="Chatbot")||($msg["name"]=="Chatter"))
    $msg["message"]="!STFU ALL"; */
  
 /* srand (hexdec (crc32 ($msg["message"])));

  $iplist = array("129.217.129.132","84.173.215.29","91.45.172.32","91.11.119.193");

  $msg["ip"] =$iplist[rand(0,3)];


  if(($msg["ip"]=="sdsad"))
	$msg["color"]=555555; */





 // $msg["ip"]="Deleted for a better world"; //substr(md5($msg["ip"]),0,8);
  return $msg;
}

?>
