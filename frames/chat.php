<!DOCTYPE html>
<html>
<head>
<title>Seite wurde verschoben</title>
</head>
<body>
Diese Webseite existiert unter dieser Adresse nicht mehr!<br> Die aktuelle Adresse lautet:
<?php
$link = "https://chat.qed-verein.de/";
if(isset($_SERVER['QUERY_STRING'])) $link .= "?" . $_SERVER['QUERY_STRING'];
echo sprintf('<a href="%s">%s</a>', htmlspecialchars($link), htmlspecialchars($link));
?>
</body>
</html>
