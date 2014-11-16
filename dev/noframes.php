<?php
$ignore_no_login = true;
$session_not_close = true;
require_once("../data.php");
require_once("../common.php");

function renderOptions()
{
	$html = "<script type='text/javascript'>\n";
	$html .= "function userOptions() {\n";
	$html .= "options['channel'] = '" . ((isset ($_GET["channel"]))? rawurldecode (demagicalize_string ($_GET["channel"])) : "") . "';\n";
	$html .= "options['redirect'] = '" . ((isset ($_GET["redirect"]) && 0 )? rawurlencode (demagicalize_string ($_GET["redirect"])) : URL_REDIRECT) . "';\n";
	$html .= "options['name'] = '" . (isset($_GET["name"])?$_GET["name"]:'') . "';\n";
	$html .= "options['last'] = " . (isset ($_GET["last"]) ? max (4, min (24, intval ($_GET["last"]))) : 20) . ";\n";
	$html .= "options['old'] = " . (isset ($_GET["old"]) ? intval ($_GET["old"]) : 0) . ";\n";
	$html .= "options['ip'] = " . (isset ($_GET["ip"]) ? intval ($_GET["ip"]) : 0) . ";\n";
	$html .= "options['delay'] = " . (isset ($_GET["delay"]) ? intval ($_GET["delay"]) : 0) . ";\n";
	$html .= "options['links'] = " . (isset ($_GET["links"]) ? intval ($_GET["links"]) : 1) . ";\n";
	$html .= "options['logIp'] = " . (isset ($_GET["logIp"]) ? intval ($_GET["logIp"]) : 1) . ";\n";
	$html .= "options['logDelay'] = " . (isset ($_GET["logDelay"]) ? intval ($_GET["logDelay"]) : 0) . ";\n";
	$html .= "options['logLinks'] = " . (isset ($_GET["logLinks"]) ? intval ($_GET["logLinks"]) : 1) . ";\n";

	$html .= "options['limit'] = '" . (isset ($_GET["limit"]) ? intval ($_GET["limit"]) : "256") . "';\n";
	$html .= "options['wait'] = '" . (isset ($_GET["wait"]) ? intval ($_GET["wait"]) : 10) . "';\n";
	$html .= "options['target'] = '" . (isset ($_GET["target"]) ? demagicalize_string ($_GET["target"]) : "_blank") . "';\n";
	$html .= "options['title'] = " . (isset ($_GET["title"]) ? intval ($_GET["title"]) : 1) . ";\n";
	$html .= "options['patient'] = " . (isset ($_GET["patient"]) ? "1" : "0") . ";\n";


	if (SECURE_POSTS)
		$html .= "options['generator'] = " . (SECURE_POSTS_GENERATOR_NUM_USES * get_key_generator ()) . ";\n";
	$html .= "}\n";
	$html .= "</script>\n";
	return $html;
}
?>

<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01//EN' 'http://www.w3.org/TR/html4/strict.dtd'>

<html>
<head>
<meta name="robots" content="noindex, nofollow">
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<link rel="stylesheet" type="text/css" href="common.css">
<link rel="stylesheet" type="text/css" href="screen.css" media="screen">
<link rel="stylesheet" type="text/css" href="mobile.css" media="handheld">
<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;">
<?php echo renderOptions(); ?>
<script type="text/javascript" src="noframes.js"></script>
<title>QED-Chat</title>
</head>
<body onload="Init()">


<div id="messagearea" class="box">

<table>
<tbody id="display">
<tr><td></td></tr>
</tbody>
</table>
<p id="status"></p>
</div>



<div id="inputarea" class="box">
<table>
	<tr>
		<td><label for="name">Name:</label></td>
		<td><input class="text" id="name" size="30" style="width: 95%"></td>
	</tr>
	<tr>
		<td><label for="message">Text:</label></td>
		<td><textarea class="text" id="message" rows="8" cols="50" style="width: 95%"></textarea></td>
	</tr>
	<tr>
		<td colspan="2" style="text-align: center"><input type="submit" value="Senden" onclick="Send()"></td>
	</tr>
</table>
</div>



<div id="settingarea" class="box settings">
	<input type="checkbox" id="ip" onclick="UpdateSettings()">IPs anzeigen
	<input type="checkbox" id="delay" onclick="UpdateSettings()">Delays anzeigen
	<input type="checkbox" id="links" onclick="UpdateSettings()">Links anzeigen
	<br>
	<input type="checkbox" id="botblock" onclick="UpdateSettings()">Sinn anzeigen
	<br>
	<input type="checkbox" id="old" onclick="UpdateSettings()">Alle empf. Posts anzeigen, sonst
	<input type="button" onclick="Decrease()" value="<">
	<input type="text" id="last" onchange="UpdateSettings()" size="2" value="24">
	<input type="button" onclick="Increase()" value=">">
</div>

<div id="logarea" class="box settings" style="margin-top: 0px">
<div style="float: left">
	<a id="lastHour">letzte Stunde</a><br>
	<a id="thisDay">aktueller Tag</a><br>
	<a id="lastDay">letzter Tag</a><br>
	<a id="threeDays">letzte drei Tage</a>
</div>
<div style="float: left; margin-left: 2mm">
	<a id="last100">letzte 100 Posts</a><br>
	<a id="last200">letzte 200 Posts</a><br>
	<a id="last500">letzte 500 Posts</a><br>
	<a id="last1000">letzte 1000 Posts</a>
</div>
<div style="float: left; margin-left: 2mm">
	<table><tr><td>von:</td><td>
	<input type="text" id="frDay" onchange="RenewLinks()" size="2"> .
	<input type="text" id="frMonth" onchange="RenewLinks()" size="2"> .
	20<input type="text" id="frYear" onchange="RenewLinks()" size="2"> ,
	<input type="text" id="frHour" onchange="RenewLinks()" size="2"> :
	<input type="text" id="frMinute" onchange="RenewLinks()" size="2"></td>
	<tr><td>bis:</td><td>
	<input type="text" id="toDay" onchange="RenewLinks()" size="2"> .
	<input type="text" id="toMonth" onchange="RenewLinks()" size="2"> .
	20<input type="text" id="toYear" onchange="RenewLinks()" size="2"> ,
	<input type="text" id="toHour" onchange="RenewLinks()" size="2"> :
	<input type="text" id="toMinute" onchange="RenewLinks()" size="2"></td>
	</tr></table>
	<input type="checkbox" id="logIp" onclick="RenewLinks()">IPs
	<input type="checkbox" id="logDelay" onclick="RenewLinks()">Delays
	<input type="checkbox" id="logLinks" onclick="RenewLinks()">Links
	<a style="margin-left: 2mm" id="log">Log anzeigen</a>
</div>

<div style="clear: both"></div>
</div>

</body>
</html>
