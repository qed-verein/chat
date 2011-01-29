<?php
	if ($_SERVER['SERVER_NAME']!='chat.qed-verein.de' && $_SERVER['SERVER_NAME']!='qedchat.qed-verein.de')
	     die ("grml");
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">

<html>

	<head>
		<meta name="robots" content="noindex, nofollow">
		<meta http-equiv="content-type" content="text/html; charset=utf-8">
		<link rel="stylesheet" type="text/css" href="chat.css">
		<script type="text/javascript">
		
			var options = new Object ();
<?php
	//HACK für fcgi
	$_GET['limit']=1;
	$_GET['patient']=true;
	unset($_GET['redirect']);
	require_once ("data.php");
	require_once ("common.php");

	echo "\t\t\toptions[\"redirect\"] = \"" . ((isset ($_GET["redirect"]) && 0 )? rawurlencode (demagicalize_string ($_GET["redirect"])) : "http://nasobem.i-networx.de/redirect.html?") . "\";\n";
	echo "\t\t\toptions[\"name\"] = \"" . (isset($_GET["name"])?$_GET["name"]:'') . "\";\n";
	echo "\t\t\toptions[\"last\"] = " . (isset ($_GET["last"]) ? max (4, min (24, intval ($_GET["last"]))) : 20) . ";\n";
	echo "\t\t\toptions[\"old\"] = " . (isset ($_GET["old"]) ? intval ($_GET["old"]) : 0) . ";\n";
	echo "\t\t\toptions[\"ip\"] = " . (isset ($_GET["ip"]) ? intval ($_GET["ip"]) : 0) . ";\n";
	echo "\t\t\toptions[\"delay\"] = " . (isset ($_GET["delay"]) ? intval ($_GET["delay"]) : 0) . ";\n";
	echo "\t\t\toptions[\"links\"] = " . (isset ($_GET["links"]) ? intval ($_GET["links"]) : 1) . ";\n";
	echo "\t\t\toptions[\"logIp\"] = " . (isset ($_GET["logIp"]) ? intval ($_GET["logIp"]) : 1) . ";\n";
	echo "\t\t\toptions[\"logDelay\"] = " . (isset ($_GET["logDelay"]) ? intval ($_GET["logDelay"]) : 0) . ";\n";
	echo "\t\t\toptions[\"logLinks\"] = " . (isset ($_GET["logLinks"]) ? intval ($_GET["logLinks"]) : 1) . ";\n";
	echo "\t\t\toptions[\"sound\"] = " . (isset ($_GET["sound"]) ? intval ($_GET["sound"]) : 0) . ";\n";
	echo "\t\t\toptions[\"sound_post\"] = \"" . (isset ($_GET["sound_post"]) ? demagicalize_string ($_GET["sound_post"]) : "spam.wav") . "\";\n";
	echo "\t\t\toptions[\"method\"] = \"" . (isset ($_GET["method"]) ? demagicalize_string ($_GET["method"]) : "detect") . "\";\n";	
	echo "\t\t\toptions[\"limit\"] = \"" . (isset ($_GET["limit"]) ? intval ($_GET["limit"]) : "256000") . "\";\n";
	echo "\t\t\toptions[\"patient\"] = \"" . (isset ($_GET["patient"]) ? intval ($_GET["patient"]) : 0) . "\";\n";
	echo "\t\t\toptions[\"wait\"] = \"" . (isset ($_GET["wait"]) ? intval ($_GET["wait"]) : 10) . "\";\n";
	echo "\t\t\toptions[\"target\"] = \"" . (isset ($_GET["target"]) ? demagicalize_string ($_GET["target"]) : "_blank") . "\";\n";
	echo "\t\t\toptions[\"title\"] = " . (isset ($_GET["title"]) ? intval ($_GET["title"]) : 1) . ";\n";
	echo "\t\t\toptions[\"css\"] = \"" . (isset ($_GET["css"]) ? htmlentities ($_GET["css"]) : "chat.css") . "\";\n";
	echo "\t\t\toptions[\"unl33t\"] = " . (isset ($_GET["unl33t"]) ? 1 : 0) . ";\n";
	echo "\t\t\toptions[\"urgent\"] = " . (isset ($_GET["no_urgency"]) ? "false" : "true") . ";\n";
	
	
	if (SECURE_POSTS)
		echo "\t\t\toptions[\"generator\"] = " . (SECURE_POSTS_GENERATOR_NUM_USES * get_key_generator ()) . ";\n";
		
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
		<frame name="recv" src="recv1337.html">
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
