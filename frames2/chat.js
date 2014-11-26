var options = new Object();
var version = "1416690087"; // muss in data ebenfalls geaendert werden

var recvPart, sendPart, confPart, logsPart;

var defaults = {
		channel: "", name: "",
		last: 24, botblock: 1, old: 0, ip: 0, delay: 0, links: 1, title: 1,
		layout: 'screen', skin: 'dunkelgrauton',
		limit: 256,	wait: 60,
		redirect: "http://uxul.de/redirect.php?", target: "_blank"
	};

// Initialisiere das Skript
function Init()
{
	integerOptions = ['last', 'limit', 'wait'];
	booleanOptions = ['botblock', 'old', 'ip', 'delay', 'links', 'title'];
	params = URIDecodeParameters()
	for(var key in defaults)
	{
		options[key] = params.hasOwnProperty(key) ? params[key] : defaults[key];
		if(integerOptions.indexOf(key) >= 0)
			options[key] = parseInt(options[key]);
		if(booleanOptions.indexOf(key) >= 0)
			options[key] = parseInt(options[key]) ? 1 : 0;
	}

	if(options['layout'] != 'frames')
		recvPart = sendPart = confPart = logsPart = document;
	else
	{
		recvPart = top.recv.document; sendPart = top.send.document;
		confPart = top.conf.document; logsPart = top.logs.document;
	}

	window.onerror = ErrorHandler;
	window.onunload = ReceiverDisconnect;

	InitReceiver();
	InitSender();
	InitLogs();
	InitSettings();
}



// *****************
// *   Empfänger   *
// *****************


var firstReconnect, recvRequest, position, textpos, posts, timeout;

function InitReceiver()
{
	recvRequest = new XMLHttpRequest();
	posts = Array();
	RecreatePosts(Array());
	position = -24;
	ReceiverConnect();
}


// Erstelle eine neue Verbindung mit dem Server
function ReceiverConnect()
{
	ReceiverDisconnect();
	SetStatus("Verbindung unterbrochen. Erstelle neue Verbindung mit dem Server ...");

	textpos = 0;
	firstReconnect = false;
	timeout = setTimeout("ReceiverConnect()", options['wait'] * 1000);

	uri = "../noframes/view.php?" + URIEncodeParameters({
	    channel: options["channel"], position: position, limit: options["limit"],
	    version: version, keepalive: Math.ceil(options["wait"] / 2)});
	// Workaround für https://bugzilla.mozilla.org/show_bug.cgi?id=408901
	uri += "&random=" + (Math.random() * 1000000);
	recvRequest.onreadystatechange = OnReceiverResponse;
	recvRequest.open('GET', uri, true);
	recvRequest.send();
}

// Schließe die Verbindung
function ReceiverDisconnect()
{
	clearTimeout(timeout);
	recvRequest.onreadystatechange = null;
	recvRequest.abort();
}

// Wird aufgerufen, falls der Server eine Antwort geschickt hat.
function OnReceiverResponse()
{
	if(recvRequest.readyState < 3)
		return;

    var end, obj;
    while((end = recvRequest.responseText.indexOf("\n", textpos)) >= 0)
    {
		obj = JSON.parse(recvRequest.responseText.substring(textpos, end));

		if(obj["type"] == "post")
			ProcessPost(obj);
		else if(obj["type"] == "error")
			throw new Error(obj["description"], obj["file"], obj["line"]);
		else if(obj["type"] != "ok" && obj["type"] != "debug")
			throw new Error("Unbekannter Typ");

		SetStatus("");
		textpos = end + 1;
		firstReconnect = true;

		// Timeout zurücksetzen
		clearTimeout(timeout);
		timeout = setTimeout("ReceiverConnect()", options['wait'] * 1000);
	}

	// Beim ersten Versuch ohne Wartezeiten neu verbinden.
	if(recvRequest.readyState == 4 && firstReconnect)
		ReceiverConnect();
}

// Wird für jede ankommende Nachricht aufgerufen
function ProcessPost(post)
{
	post['id'] = parseInt(post['id']);
	if(post['id'] < position)
		return;

	position = post['id'] + 1;
	posts.push(post);

	if (!options["old"])
	{
		var container = recvPart.getElementById("posts");
		for (var node = container.lastChild, i = 1; node != null; ++i)
		{
			var temp = node;
			node = node.previousSibling;
			if (i >= options["last"])
				container.removeChild(temp);
		}
	}

	AppendPost(recvPart.getElementById('posts'), post);
	UpdateTitle(post['message']);
	ScrollDown();
}

// Erstellt einen HTML-Knoten für diese Nachricht
function AppendPost(container, post)
{
	if(options['botblock'] && post['bottag'] == '1')
		return;

	if(options['layout'] == 'mobile')
		container.appendChild(FormatMobilePost(post));
	else
		container.appendChild(FormatScreenPost(post));
}


// Stellt eine Nachricht als HTML dar (Version für große Bildschrime)
function FormatScreenPost(post)
{
	var tr = recvPart.createElement ("tr");

	var info = post["date"].substr (5);
	if (options["delay"])
		info = DelayString(post) + info;

	var node = recvPart.createElement ("td");
	node.setAttribute ("text", "ff00ff");
	node.appendChild (recvPart.createTextNode (info));
	node.setAttribute ("class", "info");
	tr.appendChild (node);

	if (options["ip"])
	{
		var ip = recvPart.createElement ("td");
		ip.appendChild (recvPart.createTextNode (post["ip"]));
		ip.setAttribute ("class", "ip");
		tr.appendChild (ip);
	}

	node = recvPart.createElement ("td");
	node.innerHTML =  NickEscape (post["name"] + ((post['anonym'] == "1") ? " (anonym)" : "") + ":");
	node.setAttribute ("class", "name");
	node.setAttribute ("style", "color:#" + PostColor(post) + ";");
	tr.appendChild (node);

	node = recvPart.createElement ("td");
	node.innerHTML = HtmlEscape (post["message"]);
	if(options["links"]) node.innerHTML = InsertLinks(node.innerHTML);
	node.setAttribute ("class", "message");
	node.setAttribute ("style", "color:#" + PostColor(post) + ";");
	tr.appendChild (node);

	return tr;
}

// Stellt eine Nachricht als HTML dar (Version für kleine Bildschrime)
function FormatMobilePost(post)
{
	var li = recvPart.createElement('li');
	li.setAttribute('id', 'post' + post['id']);
	li.setAttribute('class', 'post');
	li.setAttribute('style', 'color:#' + PostColor(post));

	var name = recvPart.createElement('span');
	name.innerHTML = NickEscape(post["name"] + ((post['anonym'] == "1") ? " (anonym)" : "") + ":");
	name.setAttribute('class', 'name');
	li.appendChild(name);

	var date = recvPart.createElement('span');
	date.setAttribute('class', 'date');
	date.appendChild(recvPart.createTextNode(post['date']));

	var ip = recvPart.createElement('span');
	ip.appendChild(recvPart.createTextNode("[" + post['ip'] + "]"));
	ip.setAttribute('class', 'ip');

	var delay = recvPart.createElement('span');
	delay.appendChild(recvPart.createTextNode(DelayString(post)));
	delay.setAttribute('class', 'delay');

	var info = recvPart.createElement('span');
	info.setAttribute('class', 'info');
	info.appendChild(date);
	if(options['ip'])
		info.appendChild(ip);
	if(options['delay'])
		info.appendChild(delay);
	li.appendChild(info);

	var message = recvPart.createElement('span');
	message.innerHTML = HtmlEscape (post["message"]);
	if(options["links"]) message.innerHTML = InsertLinks(message.innerHTML);
	message.setAttribute('class', 'message');
	li.appendChild(message);

	return li;
}

function DelayString(post)
{
	var delay;
	var dif = post["id"] - post["delay"];
	if (post["delay"] == "")
		delay = "(?) ";
	else if (dif == 0)
		delay = "";
	else if (dif < 0)
		delay = "(x) ";
	else if (dif <= 9)
		delay = "(" + dif + ") ";
	else
		delay = "(9+) ";
	return delay;
}

// Generiert die anzeigten Posts neu (z.B. falls Einstellungen geändert werden)
function RecreatePosts(posts)
{
	var container;
	if(options['layout'] == 'mobile') container = recvPart.createElement('li');
	else container = recvPart.createElement('table');
	container.id = 'posts';

	var from = (options["old"] || inHistoryMode) ? 0 : Math.max(0, posts.length - options["last"]);
	for (var cursor = from; cursor != posts.length; ++cursor)
		AppendPost(container, posts[cursor]);
	var node = recvPart.getElementById('posts');
	node.parentNode.replaceChild(container, node);

	if(posts.length != 0 && !inHistoryMode) UpdateTitle(posts[posts.length - 1]['message']);

	ScrollDown();
}



function NickEscape (text)
{
    var ret = "";
    for (var i = 0; i < text.length; i++) {
	ret += "&#" + text.charCodeAt(i) + ";";
    }
    return ret;
}





// ************
// *   Logs   *
// ************

var historyRequest, historyPosts, inHistoryMode;

function ShowHistory(elt)
{
	logsPart.getElementById('logbox').getElementsByClassName('activelog')[0].className = 'inactivelog';
	elt.className = 'activelog';

	if(elt.id == 'newPosts')
	{
		inHistoryMode = false;
		RecreatePosts(posts);
		SetStatus("");
		ReceiverConnect();
		return;
	}


	ReceiverDisconnect();
	RecreatePosts(Array());
	SetStatus("Lade alten Chatlog...");
	parameters = "&" + URIEncodeParameters({version: version});
	url = "history.php?";

	if(elt.id == 'lastHour')
		url += URIEncodeParameters({from: '-1 hour', to: '+0 sec'});
	else if(elt.id == 'lastDay')
		url += URIEncodeParameters({from: '-1 day', to: '+0 sec'});
	else if(elt.id == 'lastWeek')
		url += URIEncodeParameters({from: '-7 days', to: '+0 sec'});
	else if(elt.id == 'last100')
		url += URIEncodeParameters({last: '100'});
	else if(elt.id == 'last300')
		url += URIEncodeParameters({last: '300'});
	else if(elt.id == 'last1000')
		url += URIEncodeParameters({last: '1000'});
	else if(elt.id == 'log')
		url += URIEncodeParameters({
			from : logsPart.getElementById("logFrom").value,
			to : logsPart.getElementById("logTo").value});
	url += parameters;

	inHistoryMode = true;

	historyRequest.onreadystatechange = OnHistoryResponse;
	historyRequest.open('GET', url, true);
	historyRequest.send();
	UpdateTitle("Chatlog: " + elt.firstChild.data);
}

// Wird aufgerufen, falls der Server eine Antwort geschickt hat.
function OnHistoryResponse()
{
	if(historyRequest.readyState != 4) return;
	if(historyRequest.status < 200 || historyRequest.status >= 300) return;

	historyPosts = Array();
	var lines = historyRequest.responseText.split("\n");
	for(var index in lines)
	{
		if(lines[index] == "") continue;

		obj = JSON.parse(lines[index]);
		if(obj["type"] == "post")
			historyPosts.push(obj);
		else if(obj["type"] == "error")
			throw new Error(obj["description"], obj["file"], obj["line"]);
	}

	RecreatePosts(historyPosts);
	SetStatus("Alter Chatlog wurde erfolgreich geladen! Um wieder die aktuellen Nachrichten anzuzeigen, " +
		"bitte im Menü <i>Logs</i> auf <i>neue Posts anzeigen</i> klicken.");
}

function InitLogs()
{
	if(options['layout'] == 'frames')
		RenewHistoryLinks();
	historyRequest = new XMLHttpRequest();
	historyPosts = Array();
	inHistoryMode = false;
}


// *********************
// *   Einstellungen   *
// *********************

function InitSettings()
{
	confPart.getElementById("ip").checked = options["ip"];
	confPart.getElementById("delay").checked = options["delay"];
	confPart.getElementById("links").checked = options["links"];
	confPart.getElementById("old").checked = options["old"];
	confPart.getElementById("last").value = count = options["last"];
	confPart.getElementById("botblock").checked = options["botblock"];

	var skins = ["schwarzwiedienacht", "dunkelgrauton", "mylittlepony"];
	for(var i in skins)
		confPart.getElementById('skin').add(new Option(skins[i], skins[i]));
	confPart.getElementById('skin').value = options['skin'];

	ApplySettings();
}

function UpdateSettings()
{
	options["ip"] = confPart.getElementById("ip").checked ? 1 : 0;
	options["delay"] = confPart.getElementById("delay").checked ? 1 : 0;
	options["links"] = confPart.getElementById("links").checked ? 1 : 0;
	options["old"] = confPart.getElementById("old").checked ? 1 : 0;
	options["botblock"] = confPart.getElementById("botblock").checked ? 1 : 0;
	options["skin"] = confPart.getElementById("skin").value;

	var input = confPart.getElementById("last");
	var num = parseInt(input.value);
	if(isNaN(num)) num = options["last"];
	input.value = options["last"] = Math.min(Math.max(num, 1), 1000);
	ApplySettings();
}


function Decrease()
{
	var input = confPart.getElementById("last");
	input.value = options['last'] = Math.max(1, parseInt(input.value) - 1);
	ApplySettings();
}

function Increase()
{
	var input = confPart.getElementById("last");
	input.value = options['last'] = Math.min(1000, parseInt(input.value) + 1);
	ApplySettings();
}

function ApplySettings()
{
	RecreatePosts(inHistoryMode ? historyPosts : posts);
	var parts = [recvPart, sendPart, confPart, logsPart];
	for(var i in parts)
		parts[i].getElementsByTagName('body')[0].className = options['skin'];

	var tempOptions = new Object();
	for(var i in options)
		if(options[i] != defaults[i]) tempOptions[i] = options[i];
	tempOptions['layout'] = 'screen';
	if(confPart.getElementById('screenlink'))
		confPart.getElementById('screenlink').href = '?' + URIEncodeParameters(tempOptions);
	tempOptions['layout'] = 'mobile';
	if(confPart.getElementById('mobilelink'))
		confPart.getElementById('mobilelink').href = '?' + URIEncodeParameters(tempOptions);
	tempOptions['layout'] = 'frames';
	if(confPart.getElementById('framelink'))
		confPart.getElementById('framelink').href = '/noframes/chat.php?' + URIEncodeParameters(tempOptions);
}


// **************
// *   Sender   *
// **************

var sendRequest, sendTimeout;

function InitSender()
{
	sendPart.getElementById("name").value = options["name"];
	sendPart.getElementById("name").focus();
	sendRequest = null;
}

function Send()
{
	if(sendRequest != null)
	{
		SetStatus("Dein alter Post wird noch gesendet ...");
		return;
	}

	SetStatus("Sende Post ...");
	ScrollDown();
	sendRequest = new XMLHttpRequest();
	sendRequest.onreadystatechange = OnSenderResponse;
	sendRequest.open("POST", "../noframes/post.php", true);
	sendRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	sendRequest.setRequestHeader("Content-Encoding", "utf-8");

	sendTimeout = setTimeout("OnSenderError()", options["wait"] * 1000);

	uri = URIEncodeParameters({
	    channel: options["channel"],
	    name: sendPart.getElementById ("name").value,
	    message: sendPart.getElementById ("message").value,
	    delay: position,
	    version: version});
	sendRequest.send(uri);
}


function OnSenderResponse()
{
	if(sendRequest.readyState != 4)
		return;

	if(sendRequest.status >= 200 && sendRequest.status < 300)
	{
		SetStatus("");
		sendPart.getElementById("message").value = "";
		sendPart.getElementById("message").focus();
		clearTimeout(sendTimeout);
		sendRequest = null;
	}
	else OnSenderError();
}


function OnSenderError()
{
	alert("Dein Post konnte nicht übertragen werden (" +
		sendRequest.status + ", '" + sendRequest.statusText + "').\n" +
			sendRequest.responseText);
	clearTimeout(sendTimeout);
	sendRequest = null;
}


// *****************
// *   Sonstiges   *
// *****************

function SetStatus(text)
{
    recvPart.getElementById("status").innerHTML = text;
}

function URIEncodeParameters(params)
{
	var result = [];
	for(var key in params)
		result.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
	return result.join("&");
}



/* Originally from http://papermashup.com/read-url-get-variables-withjavascript/, but adapted. */
function URIDecodeParameters() {
	var vars = {}, k, v;
	location.search.replace(/[?&]+([^=&]+)=([^&#]*)/gi, function(m,key,value) {
		k = decodeURIComponent(key.replace(/\+/g, '%20'));
		v = decodeURIComponent(value.replace(/\+/g, '%20'));
		vars[k] = v;
	});
	return vars;
}


function PostColor(post)
{
	return (options['skin'] != 'mylittlepony') ? post['color'] :
		(parseInt(post['color'], 16) ^ parseInt("FFFFFF", 16)).toString(16);
}

function ScrollDown()
{
	var node = recvPart.getElementById("messagebox");
	node.scrollTop = node.scrollHeight;
}

function HtmlEscape (text)
{
	text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	return text.replace(/\"/g, "&quot;").replace(/\n/g, "<br>");
}

function InsertLinks (text)
{
	return text.replace (/(https:\/\/|http:\/\/|ftp:\/\/)([\w\&.~%\/?#=@:\[\]+\$\,-;]*)/g,
		'<a rel="noreferrer" target="_blank" href="$1$2">$1$2</a>');
}

function UpdateTitle(message)
{
	if(options["title"])
		top.document.title = (message.length < 256) ? message :
			top.document.title = message.substr(0, 252) + "...";
}


function ErrorHandler(description, filename, line)
{
	message = "Ein Fehler trat auf:<br>";
	message += HtmlEscape(description) + "<br>";
	message += "In Datei " + filename + ", Zeile " + line + ".<br>";
	//message += "Bitte Seite neu laden. (Unter Firefox Strg+Shift+R).";
	SetStatus(message);
	ReceiverDisconnect();
	return false;
}


// Altlasten aus der Frame-Version

function GetValue (value)
{
	var temp = parseInt (value);
	if (isNaN (temp)) return "";
	else return temp;
}

function GetDateString (prefix)
{
	var year = GetValue (logsPart.getElementById (prefix + "Year").value);
	return GetValue (logsPart.getElementById (prefix + "Minute").value) + "_"
		+ GetValue (logsPart.getElementById (prefix + "Hour").value) + "_"
		+ GetValue (logsPart.getElementById (prefix + "Day").value) + "_"
		+ GetValue (logsPart.getElementById (prefix + "Month").value) + "_"
		+ (year == "" ? "" : 2000 + year);
}

function RenewHistoryLinks()
{
	parameters = "&ip=" + (confPart.getElementById ("ip").checked ? 1 : 0)
		+ "&delay=" + (confPart.getElementById ("delay").checked ? 1 : 0)
		+ "&links=" + (confPart.getElementById ("links").checked ? 1 : 0);

	logsPart.getElementById ("lastHour").href = "../frames/history.php?from=-60" + parameters;
	logsPart.getElementById ("thisDay").href = "../frames/history.php?from=0_0" + parameters;
	logsPart.getElementById ("lastDay").href = "../frames/history.php?from=0_-24" + parameters;
	logsPart.getElementById ("threeDays").href = "../frames/history.php?from=0_-72" + parameters;

	logsPart.getElementById ("last100").href = "../frames/history.php?last=100" + parameters;
	logsPart.getElementById ("last200").href = "../frames/history.php?last=200" + parameters;
	logsPart.getElementById ("last500").href = "../frames/history.php?last=500" + parameters;
	logsPart.getElementById ("last1000").href = "../frames/history.php?last=1000" + parameters;

	logsPart.getElementById ("log").href = "history.php?" + "from=" + GetDateString ("fr") +
		"&to=" + GetDateString ("to") + parameters;
}
