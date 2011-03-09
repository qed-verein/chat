<?php

//	"id" "name" "message" "date"] "ip" "delay" "hollow" "color";
function xorgmod($msg) {
  if (($msg["ip"] == "134.2.62.65") && ($msg["name"]=="     Xorg")) {
    $msg["ip"] = "Plunder Krøt";
    $msg["color"] = "ffb020"; //"ffe890"; //"ffc870";
  }
  $msg["message"] = ereg_replace("(B|b)lub([^b]|\$)","\\1lubb\\2",$msg["message"]);
  return $msg;
}

?>
