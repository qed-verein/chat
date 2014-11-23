<?php
	function demagicalize_string ($string)
	{
		if (get_magic_quotes_gpc ())
			$string = stripslashes ($string);

		return $string;
	}

	$ignore_no_login=true;
	$session_not_close=true;
	chdir("noframes");
	require_once ("common.php");

	if($_SERVER['SERVER_NAME'] != 'chat.qed-verein.de')
		die("grml");

	if(empty($_SESSION['userid']))
		redirect("https://chat.qed-verein.de/noframes/account.php");
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">

<html>

<head>
<meta name="robots" content="noindex, nofollow" />
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<link rel="stylesheet" type="text/css" href="chat.css" />

<script type="text/javascript">
<?php
echo "\tvar options = new Object ();\n";
echo "\toptions[\"channel\"] = \"" . ((isset ($_GET["channel"]))? rawurldecode (demagicalize_string ($_GET["channel"])) : "") . "\";\n";
echo "\toptions[\"redirect\"] = \"" . ((isset ($_GET["redirect"]) && 0 )? rawurlencode (demagicalize_string ($_GET["redirect"])) : URL_REDIRECT) . "\";\n";
echo "\toptions[\"laghack\"] = " . ((isset ($_GET["laghack"])) ? "true" : "false") . ";\n";
echo "\toptions[\"name\"] = \"" . (isset($_GET["name"])?$_GET["name"]:'') . "\";\n";
echo "\toptions[\"last\"] = " . (isset ($_GET["last"]) ? max (4, min (24, intval ($_GET["last"]))) : 20) . ";\n";
echo "\toptions[\"old\"] = " . (isset ($_GET["old"]) ? intval ($_GET["old"]) : 0) . ";\n";
echo "\toptions[\"ip\"] = " . (isset ($_GET["ip"]) ? intval ($_GET["ip"]) : 0) . ";\n";
echo "\toptions[\"delay\"] = " . (isset ($_GET["delay"]) ? intval ($_GET["delay"]) : 0) . ";\n";
echo "\toptions[\"links\"] = " . (isset ($_GET["links"]) ? intval ($_GET["links"]) : 1) . ";\n";
echo "\toptions[\"logIp\"] = " . (isset ($_GET["logIp"]) ? intval ($_GET["logIp"]) : 1) . ";\n";
echo "\toptions[\"logDelay\"] = " . (isset ($_GET["logDelay"]) ? intval ($_GET["logDelay"]) : 0) . ";\n";
echo "\toptions[\"logLinks\"] = " . (isset ($_GET["logLinks"]) ? intval ($_GET["logLinks"]) : 1) . ";\n";
echo "\toptions[\"method\"] = \"" . (isset ($_GET["method"]) ? demagicalize_string ($_GET["method"]) : "detect") . "\";\n";
echo "\toptions[\"limit\"] = \"" . (isset ($_GET["limit"]) ? intval ($_GET["limit"]) : "256") . "\";\n";
echo "\toptions[\"wait\"] = \"" . (isset ($_GET["wait"]) ? intval ($_GET["wait"]) : 60) . "\";\n";
echo "\toptions[\"target\"] = \"" . (isset ($_GET["target"]) ? demagicalize_string ($_GET["target"]) : "_blank") . "\";\n";
echo "\toptions[\"title\"] = " . (isset ($_GET["title"]) ? intval ($_GET["title"]) : 1) . ";\n";
echo "\toptions[\"css\"] = \"" . (isset ($_GET["css"]) ? htmlentities ($_GET["css"]) : "chat.css") . "\";\n";
echo "\toptions[\"unl33t\"] = " . (isset ($_GET["unl33t"]) ? 1 : 0) . ";\n";
echo "\toptions[\"urgent\"] = " . (isset ($_GET["no_urgency"]) ? "false" : "true") . ";\n";
echo "\toptions[\"version\"] = " . (isset ($_GET["version"]) ? 0 : CHAT_VERSION) . ";\n";


$sizeRecv0 = (isset ($_GET["sizeRecv0"]) ? demagicalize_string ($_GET["sizeRecv0"]) : "60%");
$sizeRecv1 = (isset ($_GET["sizeRecv1"]) ? demagicalize_string ($_GET["sizeRecv1"]) : "40%");
$sizeSend0 = (isset ($_GET["sizeSend0"]) ? demagicalize_string ($_GET["sizeSend0"]) : "60%");
$sizeSend1 = (isset ($_GET["sizeSend1"]) ? demagicalize_string ($_GET["sizeSend1"]) : "40%");
$sizeHelp0 = (isset ($_GET["sizeHelp0"]) ? demagicalize_string ($_GET["sizeHelp0"]) : "50%");
$sizeHelp1 = (isset ($_GET["sizeHelp1"]) ? demagicalize_string ($_GET["sizeHelp1"]) : "50%");
?>
</script>
<script type="text/javascript" src="index.js"></script>
<title>QED-Chat v6</title>
</head>

<?php echo '<frameset rows="' . $sizeRecv0 . ', ' . $sizeRecv1 . '">';?>
	<frame name="recv" src="receive.html">
	<?php echo '<frameset cols="' . $sizeSend0 . ', ' . $sizeSend1 . '">';?>
		<frame name="send" src="send2.html">
		<?php echo '<frameset rows="' . $sizeHelp0 . ', ' . $sizeHelp1 . '">';?>
			<frame name="help" src="help.html">
			<frame name="logs" src="logs.html">
		</frameset>
	</frameset>
	<noframes>
	  Diese Seite ben&ouml;tigt Frames um zu funktionieren.
	</noframes>
</frameset>

</html>
