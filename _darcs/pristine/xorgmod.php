<?php

$global_xorg_seed = rand();
$global_xorg_mem = array("submsgix" => 0);

//	"id" "name" "message" "date" "ip" "delay" "hollow" "color";
function xorgmod($msg) {
  global $global_xorg_seed,$global_xorg_mem;
  srand($global_xorg_seed);

  if (($msg["ip"] == "134.2.62.65") && ($msg["name"]=="     Xorg")) {
    $msg["ip"] = "\u2654"; // 265a
//    $msg["ip"] = "Plunder Krøt";
    $msg["color"] = "ffb020"; //"ffe890"; //"ffc870";
  }
  if (ereg("^84\\.151\\.",$msg["ip"]) /*&& ($msg["name"]=="Stefan")*/) {
    $msg["ip"] = "spammer";
  }
  if ($msg["name"] == "  Christian") $msg["ip"] = "87.174.105.89";

  if (rand (0, 1))
    $msg["message"] = eregi_replace("(blu(b))([^bB]|\$)","\\1\\2\\3",$msg["message"]);
  else $msg["message"] = eregi_replace("(blub)b+","\\1",$msg["message"]);

//  if (rand (0, 4)==0)
//    $msg["message"] = eregi_replace("Post allowed by CIA","Post censored by CIA",$msg["message"]);

  $msg["message"] = eregi_replace("kaputt|ist down","schtonk",$msg["message"]);

  $submsg = "THEYCHAT.YOUREFIRED.TRUSTTHECHAT.";
#  $submsg = "THECHATISYOURFRIEND.TRUSTTHECHAT.";

  $i = $msg["id"] % strlen($submsg);
  $msg["date"] = $msg["date"]." ".substr($submsg,$i,1);

/*  $i = rand (0, 100);
  if ($i == 0)
    $msg["message"] = ereg_replace("(B|b)lub([^b]|\$)","\\1lubb\\2",$msg["message"]);
  elseif ($i == 1)
    $msg["message"] = ereg_replace("(B|b)lubb","\\1lub",$msg["message"]);
*/

  $global_xorg_seed = rand();
  return $msg;
}

?>
