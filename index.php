<?php
	$ignore_no_login=true;
	$session_not_close=true;
	require_once ("data.php");
	require_once ("common.php");

	if ($_SERVER['SERVER_NAME']!='chat.qed-verein.de' && $_SERVER['SERVER_NAME']!='qedchat.qed-verein.de')
		die ("grml");
	function userhash($username, $password) {
		return sha1($username . $password);
	}

	$mobile = isset($_GET["mobile"]) ? true : false;

?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">

<html>

	<head>
		<meta name="robots" content="noindex, nofollow" />
		<meta http-equiv="content-type" content="text/html; charset=utf-8" />
		<?php if ($mobile) {
		       echo '<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;"/>';
		      }?>
		<link rel="stylesheet" type="text/css" href="chat-mobile.css" media="handheld" />
		<link rel="stylesheet" type="text/css" href="chat.css" media="screen" />

<?php
	if (!empty($_REQUEST['username']) && !empty($_REQUEST['password'])) {
		mysql_connect (SQL_HOST, SQL_USER, SQL_PASSWORD);
		mysql_select_db (SQL_DATABASE);
		$pw=userhash($_REQUEST['username'],$_REQUEST['password']);
		$user=mysql_real_escape_string($_REQUEST['username']);
		//echo $pw;
		mysql_query('SET NAMES "utf8"');
		$userid=@mysql_result(mysql_query('SELECT id FROM user WHERE username="'.$user.'" AND password="'.$pw.'"'),0,0);
		if ($userid) {
			$_SESSION['userid']=$userid;
			$_SESSION['anonym'] = 0;
			unset($_REQUEST['logout']);
		}
		else {
			$falsches_pw=true;
		}
	}

	if (!empty($_REQUEST['anonym'])) {
		$_SESSION['userid'] = 0;
		$_SESSION['anonym'] = 1;
	}

	if (!empty($_REQUEST['logout'])) {
		session_destroy();
		unset($_SESSION['userid']);
	}
	if (!empty($_SESSION['userid']) || !empty($_SESSION['anonym'])) {
		//HACK für fcgi
		$_GET['patient']=true;
		unset($_GET['redirect']);

		?>
		<script type="text/javascript">
		<?php
		echo "function initOptions() {\n";
		echo "\t\t\tvar options = new Object ();\n";
		echo "\t\t\toptions[\"channel\"] = \"" . ((isset ($_GET["channel"]))? rawurldecode (demagicalize_string ($_GET["channel"])) : "") . "\";\n";
		echo "\t\t\toptions[\"redirect\"] = \"" . ((isset ($_GET["redirect"]) && 0 )? rawurlencode (demagicalize_string ($_GET["redirect"])) : URL_REDIRECT) . "\";\n";
		echo "\t\t\toptions[\"laghack\"] = " . ((isset ($_GET["laghack"])) ? "true" : "false") . ";\n";
		echo "\t\t\toptions[\"name\"] = \"" . (isset($_GET["name"])?$_GET["name"]:'') . "\";\n";
		echo "\t\t\toptions[\"last\"] = " . (isset ($_GET["last"]) ? max (4, min (24, intval ($_GET["last"]))) : 20) . ";\n";
		echo "\t\t\toptions[\"old\"] = " . (isset ($_GET["old"]) ? intval ($_GET["old"]) : 0) . ";\n";
		echo "\t\t\toptions[\"ip\"] = " . (isset ($_GET["ip"]) ? intval ($_GET["ip"]) : 0) . ";\n";
		echo "\t\t\toptions[\"delay\"] = " . (isset ($_GET["delay"]) ? intval ($_GET["delay"]) : 0) . ";\n";
		echo "\t\t\toptions[\"links\"] = " . (isset ($_GET["links"]) ? intval ($_GET["links"]) : 1) . ";\n";
		echo "\t\t\toptions[\"logIp\"] = " . (isset ($_GET["logIp"]) ? intval ($_GET["logIp"]) : 1) . ";\n";
		echo "\t\t\toptions[\"logDelay\"] = " . (isset ($_GET["logDelay"]) ? intval ($_GET["logDelay"]) : 0) . ";\n";
		echo "\t\t\toptions[\"logLinks\"] = " . (isset ($_GET["logLinks"]) ? intval ($_GET["logLinks"]) : 1) . ";\n";
		echo "\t\t\toptions[\"method\"] = \"" . (isset ($_GET["method"]) ? demagicalize_string ($_GET["method"]) : "detect") . "\";\n";
		echo "\t\t\toptions[\"limit\"] = \"" . (isset ($_GET["limit"]) ? intval ($_GET["limit"]) : "256") . "\";\n";
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
		echo "\t\t\treturn options;\n";
		echo "}\n";
		echo "var options = initOptions();\n";
		?>
		</script>
		<script type="text/javascript" src="index.js"></script>
		<?php
	}
?>

		<title>QED-Chat v6</title>
	</head>

<?php
	if($mobile) {
		echo '<frameset rows="' . $sizeRecv0 . ', ' . $sizeRecv1 . '">';
		echo '<frame name="recv" src="receive.html" />';
		echo '<frame name="send" src="send2.html" />';
		echo '</frameset>';
	} else if (!empty($_SESSION['userid']) || !empty($_SESSION['anonym'])) { ?>
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
	<?php } else {

	if (!empty($falsches_pw)) {
		echo "Falsches PW";
	}
	?>
	<!-- Anonym: <a href="index.php?anonym=1">hier</a><br />-->

	<b>Regeln:</b> Die Nutzung des Chats verpflichtet zur Einhaltung geltenden Rechts sowie der üblichen Netiquette.
	Bei Verstößen kann eine Sperrung des Zugangs erfolgen.

	<form action="" method="post">
		Username: <input name="username" /><br />
		Passwort: <input name="password" type="password" /> <br />
		<input type="submit" />
	</form>
	Hinweis: Der Username und das Passwort ist dasselbe wie f&uuml;r die qeddb.
	Bei Problemen, bitte an <a href="mailto:webmaster@qed-verein.de">webmaster@qed-verein.de</a> schreiben.
	<?php } ?>
</html>
