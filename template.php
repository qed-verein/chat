<!DOCTYPE html>

<html>
<head>
	<title>QED-Chat</title>
	<meta name="robots" content="noindex, nofollow">
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<link rel="stylesheet" type="text/css" href="common.css">
<?php if(in_array('screen', $parts)): ?>
	<link rel="stylesheet" type="text/css" href="screen.css">
	<script type="text/javascript" src="chat.js"></script>
<?php elseif(in_array('mobile', $parts)): ?>
	<link rel="stylesheet" type="text/css" href="mobile.css">
	<script type="text/javascript" src="chat.js"></script>
	<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0">
	<script>
	function ShowMenu(menu)
	{
		document.getElementById('settingbox').style.display = (menu == 'settings') ? 'block' : 'none';
		document.getElementById('logbox').style.display = (menu == 'logs') ? 'block' : 'none';
	}
	</script>
<?php elseif(in_array('frames', $parts)): ?>
	<link rel="stylesheet" type="text/css" href="screen.css">
	<script type="text/javascript">
		var OnLayoutClicked = parent.OnLayoutClicked;
		var OnHistoryClicked = parent.OnHistoryClicked;
		var UpdateSettings = parent.UpdateSettings;
		var Send = parent.Send;
		var RecreatePosts = parent.RecreatePosts;
	</script>
<?php endif; ?>
	<link rel="stylesheet" type="text/css" href="colors.css">
</head>

<?php if(in_array('frames', $parts)): ?>
<body>
<?php else: ?>
<body onload="Init()">
<?php endif; ?>

<?php if(in_array('receiver', $parts)): ?>
<div id="messagebox" class="box">
<div id="posts"></div>
<p id="status"></p>
</div>
<?php endif; ?>

<?php if(in_array('send', $parts)): ?>
<div id="inputbox" class="box">
<table>
	<tr>
		<td><label for="name">Name:</label></td>
		<td><input class="text" id="name" size="30" onchange="UpdateSettings()"></td>
	</tr>
	<tr>
		<td><label for="message">Text:</label></td>
		<td><textarea class="text" id="message" rows="8" cols="60"></textarea></td>
	</tr>
	<tr>
		<td colspan="2" style="text-align: center"><input type="submit" value="Senden" onclick="Send()"></td>
	</tr>
</table>
</div>
<?php elseif(in_array('send_mobile', $parts)): ?>
<div id="inputbox" class="box">
	<input id="name" placeholder="Name" tabindex="1" size="50" onchange="UpdateSettings()">
	<input id="send" type="submit" value="Senden" tabindex="3" onclick="Send()">
	<input type="button" value="Einstellen" tabindex="4" onclick="ShowMenu('settings')">
	<input type="button" value="Logs" tabindex="5" onclick="ShowMenu('logs')">
	<textarea id="message" placeholder="Nachricht" tabindex="2" rows="3" cols="50"></textarea>
</div>
<?php endif; ?>

<?php if(in_array('settings', $parts)): ?>
<div id="settingbox" class="box">
<ul>
	<li><label><input type="checkbox" id="ip" onchange="UpdateSettings()">IPs anzeigen</label></li>
	<li><label><input type="checkbox" id="delay" onchange="UpdateSettings()">Delays anzeigen</label></li>
	<li><label><input type="checkbox" id="links" onchange="UpdateSettings()">Links anzeigen</label></li>
	<li><label><input type="checkbox" id="botblock" onchange="UpdateSettings()">Sinn anzeigen</label></li>
	<li><label><input type="checkbox" id="math" onchange="UpdateSettings()">Mathjax anschalten</label>,</li>
	<li><label><input type="checkbox" id="old" onchange="UpdateSettings()">Alle empf. Posts anzeigen</label>,</li>
	<li>sonst
		<input type="button" onclick="Decrease()" value="<">
		<input type="text" id="last" onchange="UpdateSettings()" size="2" value="24">
		<input type="button" onclick="Increase()" value=">">
	</li>
	<li><label>Farbschema: <select id="skin" size="1" onchange="UpdateSettings()"></select></label></li>
	<li><label>Layout: <select id="layout" size="1" onchange="OnLayoutClicked(this)"></select></label></li>
</ul>
<?php if(in_array('mobile', $parts)): ?>
<p style="text-align: center">
<input type="button" value="Schließen" onclick="ShowMenu('')">
</p>
<?php endif; ?>
</div>
<?php endif; ?>

<?php if(in_array('logs', $parts)): ?>
<div id="logbox" class="box">
<ul>
	<li><a id="lastHour" onclick="OnHistoryClicked(this)">letzte Stunde</a></li>
	<li><a id="lastDay" onclick="OnHistoryClicked(this)">letzter Tag</a></li>
	<li><a id="lastWeek" onclick="OnHistoryClicked(this)">letzte Woche</a></li>
</ul>
<ul>
	<li><a id="last100" onclick="OnHistoryClicked(this)">letzte 100 Posts</a></li>
	<li><a id="last300" onclick="OnHistoryClicked(this)">letzte 300 Posts</a></li>
	<li><a id="last1000" onclick="OnHistoryClicked(this)">letzte 1000 Posts</a></li>
</ul>
<ul>
	<li><label><span style="display: inline-block; width: 3em">von:</span>
	<input id="logFrom" type="text" size="12" placeholder="TT.MM.JJJJ"></label></li>
	<li><label><span style="display: inline-block; width: 3em">bis:</span>
	<input id="logTo" type="text" size="12" placeholder="TT.MM.JJJJ"></label></li>
	<li><a id="interval" onclick="OnHistoryClicked(this)">Intervall anzeigen</a></li>
</ul>
<?php if(in_array('mobile', $parts)): ?>
<p style="text-align: center">
<input type="button" value="Schließen" onclick="ShowMenu('')">
</p>
<?php endif; ?>
</div>
<?php endif; ?>

</body>
</html>
