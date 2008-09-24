<?php

function pfz($n)
{
  if ($n == 0) return "0";
  if ($n == 1) return "1";
  if ($n == -1) return "-1";
  $res = "";
  if ($n < 0) {
    $res = "*(-1)";
    $n = -$n;
  }
  $i = 2;
  $k = sqrt($n);
  $s = 2;
  while (($n > 1) && ($i <= $k)) {
    while ($n%$i == 0) {
      $res .= "*$i";
      $n /= $i;
    }
    if ($i >= 5)
    {
      $i+=$s;
      $s = 4-$s;
    } else $i+=$i-1;
  }
  if ($n != 1) $res .= "*$n";
  return substr($res,1);
}

/*
$msg = array("message" => $HTTP_GET_VARS["msg"]);
$i = 0;

  if ($i == 0)
    $msg["message"] = preg_replace_callback('/([1-9][0-9]{3,8})/',
      create_function('$treffer','return pfz($treffer[0]);'),$msg["message"]);

echo htmlentities($msg["message"]);
//echo pfz(2358556200)."\n".pfz(1)."\n".pfz(0)."\n".pfz(-1)."\n".pfz(-2358556200);
*/

?>
