var options = new Object();
var version = "1413235752"; // muss in data ebenfalls geaendert werden

// Initialisiere das Skript
function Init ()
{
	defaults = {
		channel: "", name: "",
		last: 24, botblock: 1, old: 0, ip: 0, delay: 0,	links: 1, title: 1, mobile: 1,
		logIp: 1, logDelay: 0, logLinks: 1,	target: "_blank",
		limit: 256,	wait: 60,
		redirect: "http://uxul.de/redirect.php?"
	};

	stringOptions = ['redirect', 'channel', 'name', 'target'];

	params = URIDecodeParameters()
	for(var key in defaults)
	{
		options[key] = params.hasOwnProperty(key) ? params[key] : defaults[key];
		if(stringOptions.indexOf(key) < 0)
			options[key] = parseInt(options[key]);
	}

	InitReceiver();
	InitSender();
	if(options['mobile'] == 0)
	{
		InitLogs();
		InitSettings();
	}
}



// *****************
// *   Empfänger   *
// *****************


var firstReconnect, recvRequest, position, textpos, posts, timeout;

function InitReceiver()
{
	window.onerror = ErrorHandler;
	recvRequest = new XMLHttpRequest();
	posts = Array();
	position = -24;
	ReceiverConnnect();
}


// Schicke dem Server eine Anfrage, ob neue Nachrichten angekommen sind.
function ReceiverConnnect()
{
	textpos = 0;
	firstReconnect = false;
	timeout = setTimeout("OnReceiverTimeout()", options['wait'] * 1000);

	uri = "../viewneu.php?" + URIEncodeParameters({
	    channel: options["channel"], position: position, limit: options["limit"],
	    version: version, type: 'json', feedback: options["wait"] / 2});
	// Workaround für https://bugzilla.mozilla.org/show_bug.cgi?id=408901
	uri += "&random=" + (Math.random() * 1000000);
	recvRequest.onreadystatechange = OnReceiverResponse;
	recvRequest.open('GET', uri, true);
	recvRequest.send();
}

// Wird aufgerufen, falls der Server eine Antwort geschickt hat.
function OnReceiverResponse()
{
	if(recvRequest.readyState < 3)
		return;

    var end, obj;
    while((end = recvRequest.responseText.indexOf(";", textpos)) >= 0)
    {
		obj = JSON.parse(recvRequest.responseText.substring(textpos, end));
		for(var key in obj)
			obj[key] = decodeURIComponent(obj[key]);

		if(obj["type"] == "post")
			ProcessPost(obj);
		else if(obj["type"] == "error")
			throw new Error(obj["description"], obj["file"], obj["line"]);
		else if(obj["type"] != "ok")
			throw new Error("Unbekannter Typ");

		SetStatus("");
		textpos = end + 1;
		firstReconnect = true;

		clearTimeout(timeout);
		timeout = setTimeout("OnReceiverTimeout()", options['wait'] * 1000);
	}

	// Beim ersten Versuch ohne Wartezeiten neu verbinden.
	if(recvRequest.readyState == 4 && firstReconnect)
		OnReceiverTimeout();
}

// Wird aufgerufen, falls zu lange keine Antwort vom Server gekommen ist
function OnReceiverTimeout()
{
	ReceiverDisconnect();
	SetStatus("Verbindung unterbrochen. Erstelle neue Verbindung mit dem Server ...");
	ReceiverConnnect();
}

// Schließe die Verbindung
function ReceiverDisconnect()
{
	clearTimeout(timeout);
	recvRequest.onreadystatechange = null;
	recvRequest.abort();
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
		var display = document.getElementById ("display");
		for (var node = display.lastChild, i = 1; node != null; ++i)
		{
			var temp = node;
			node = node.previousSibling;
			if (i >= options["last"])
				display.removeChild (temp);
		}
	}

	CreatePost(post);

	if (options["title"])
		top.document.title = (post["message"].length < 256) ? post["message"] :
			top.document.title = post["message"].substr(0, 252) + "...";

	SetStatus("");
}

// Erstellt einen HTML-Knoten für diese Nachricht
function CreatePost(post)
{
	var node;

	if(options['mobile'] == 1)
		node = FormatMobilePost(post);
	else
		node = FormatScreenPost(post);

	document.getElementById("display").appendChild(node);

	node = document.getElementById("messagebox");
	node.scrollTop = node.scrollHeight;
}

// Stellt eine Nachricht als HTML dar (Version für große Bildschrime)
function FormatScreenPost(post)
{
	var tr = document.createElement ("tr");

	var info = post["date"].substr (5);
	if (options["botblock"]) {
	    if (post["bottag"]==1)
		return;
	}
	if (options["delay"])
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

		info = delay + info;
	}

	var node = document.createElement ("td");
	node.setAttribute ("text", "ff00ff");
	node.appendChild (document.createTextNode (info));
	node.setAttribute ("class", "info");
	tr.appendChild (node);

	if (options["ip"])
		tr.appendChild (GetNodeIp (post));

	node = document.createElement ("td");
	node.innerHTML =  NickEscape (post["name"] + ((post['anonym'] == "1") ? " (anonym)" : "") + ":");
	node.setAttribute ("class", "name");
	node.setAttribute ("style", "color:#" + post["color"] + ";");
	tr.appendChild (node);

	node = document.createElement ("td");
	node.innerHTML = HtmlEscape (post["message"], options["links"]);
	node.setAttribute ("class", "message");
	node.setAttribute ("style", "color:#" + post["color"] + ";");
	tr.appendChild (node);

	return tr;
}

// Stellt eine Nachricht als HTML dar (Version für kleine Bildschrime)
function FormatMobilePost(post)
{
	var li = document.createElement('li');
	li.setAttribute('id', 'post' + post['id']);
	li.setAttribute('class', 'post');
	li.setAttribute('style', 'color:#' + post['color']);

	var name = document.createElement('span');
	name.innerHTML = NickEscape(post["name"] + ((post['anonym'] == "1") ? " (anonym)" : "") + ":");
	name.setAttribute('class', 'name');
	li.appendChild(name);

	var ip = document.createElement('span');
	ip.appendChild(document.createTextNode("[" + post['ip'] + "]"));
	ip.setAttribute('class', 'ip');

	var info = document.createElement('span');
	info.setAttribute('class', 'info');
	info.appendChild(document.createTextNode(post['date']));
	if(options['ip'] == 1)
		info.appendChild(GetNodeIp(ip));
	li.appendChild(info);

	var message = document.createElement('span');
	message.innerHTML = HtmlEscape(post['message'], options['links']);
	message.setAttribute('class', 'message');
	li.appendChild(message);

	return li;
}

// Generiert die anzeigten Posts neu (z.B. falls Einstellungen geändert werden)
function RecreatePosts ()
{
	var display = document.getElementById ("display");
	while (display.hasChildNodes ())
		display.removeChild (display.lastChild);

	var from = (options["old"] ? 0 : Math.max (0, posts.length - options["last"]));
	for (var cursor = from; cursor != posts.length; ++cursor)
		CreatePost (posts[cursor]);
}


function ErrorHandler(description, filename, line)
{
	message = "Ein Fehler trat auf:<br>";
	message += HtmlEscape(description) + "<br>";
	message += "In Datei " + filename + ", Zeile " + line + ".<br>";
	message += "Bitte Seite neu laden. (Unter Firefox Strg+Shift+R).";
	SetStatus(message);
	ReceiverDisconnect();
	return false;
}

function InsertLinks (text)
{
	return text.replace (/(https:\/\/|http:\/\/|ftp:\/\/)([\w\&.~%\/?#=@:\[\]+\$\,-;]*)/g,
		'<a rel="noreferrer" target="_blank" href="$1$2">$1$2</a>');
}

function GetNodeIp (post)
{
	node = document.createElement ("td");
	node.appendChild (document.createTextNode (post["ip"]));
	node.setAttribute ("class", "ip");
	return node;
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


function GetValue (value)
{
	var temp = parseInt (value);
	return isNaN(temp) ? "" : temp;
}

function GetDateString (prefix)
{
	var year = GetValue (document.getElementById (prefix + "Year").value);
	return GetValue (document.getElementById (prefix + "Minute").value) + "_"
		+ GetValue (document.getElementById (prefix + "Hour").value) + "_"
		+ GetValue (document.getElementById (prefix + "Day").value) + "_"
		+ GetValue (document.getElementById (prefix + "Month").value) + "_"
		+ (year == "" ? "" : 2000 + year);
}

function RenewLinks ()
{
	parameters = "&ip=" + (document.getElementById ("logIp").checked ? 1 : 0)
		+ "&delay=" + (document.getElementById ("logDelay").checked ? 1 : 0)
		+ "&links=" + (document.getElementById ("logLinks").checked ? 1 : 0);

	document.getElementById ("lastHour").href = "../history.php?from=-60" + parameters;
	document.getElementById ("thisDay").href = "../history.php?from=0_0" + parameters;
	document.getElementById ("lastDay").href = "../history.php?from=0_-24" + parameters;
	document.getElementById ("threeDays").href = "../history.php?from=0_-72" + parameters;

	document.getElementById ("last100").href = "../history.php?last=100" + parameters;
	document.getElementById ("last200").href = "../history.php?last=200" + parameters;
	document.getElementById ("last500").href = "../history.php?last=500" + parameters;
	document.getElementById ("last1000").href = "../history.php?last=1000" + parameters;

	document.getElementById ("log").href = "../history.php?" + "from=" + GetDateString ("fr") + "&to=" + GetDateString ("to") + parameters;
}



function InitLogs()
{
	document.getElementById ("logIp").checked = options["logIp"];
	document.getElementById ("logDelay").checked = options["logDelay"];
	document.getElementById ("logLinks").checked = options["logLinks"];

	document.getElementById ("lastHour").target = options["target"];
	document.getElementById ("thisDay").target = options["target"];
	document.getElementById ("lastDay").target = options["target"];
	document.getElementById ("threeDays").target = options["target"];

	document.getElementById ("last100").target = options["target"];
	document.getElementById ("last200").target = options["target"];
	document.getElementById ("last500").target = options["target"];
	document.getElementById ("last1000").target = options["target"];

	document.getElementById ("log").target = options["target"];

	RenewLinks ();
}




// *********************
// *   Einstellungen   *
// *********************

function InitSettings()
{
	document.getElementById("ip").checked = options["ip"];
	document.getElementById("delay").checked = options["delay"];
	document.getElementById("links").checked = options["links"];
	document.getElementById("old").checked = options["old"];
	document.getElementById("last").value = count = options["last"];
	document.getElementById("botblock").checked = options["botblock"];
}

function UpdateSettings()
{
	options["ip"] = document.getElementById("ip").checked;
	options["delay"] = document.getElementById("delay").checked;
	options["links"] = document.getElementById("links").checked;
	options["old"] = document.getElementById("old").checked;
	options["botblock"] = document.getElementById("botblock").checked;

	var input = document.getElementById("last");
	var num = parseInt(input.value);
	if(isNaN(num)) num = options["last"];
	input.value = options["last"] = Math.min(Math.max(num, 1), 1000);
	RecreatePosts();
}


function Decrease()
{
	var input = document.getElementById("last");
	input.value = options['last'] = Math.max(1, parseInt(input.value) - 1);
	RecreatePosts();
}

function Increase()
{
	var input = document.getElementById("last");
	input.value = options['last'] = Math.min(1000, parseInt(input.value) + 1);
	RecreatePosts();
}


// **************
// *   Sender   *
// **************

var sendRequest;

function InitSender()
{
	if(options['name'] != '')
		document.getElementById("name").value = options["name"];
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
	setTimeout("OnSenderError()", options["wait"] * 1000);

	sendRequest = new XMLHttpRequest();
	sendRequest.onreadystatechange = OnSenderResponse;
	sendRequest.open("POST", "../post.php", true);
	sendRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	sendRequest.setRequestHeader("Content-Encoding", "utf-8");

	uri = URIEncodeParameters({
	    channel: options["channel"],
	    name: document.getElementById ("name").value,
	    message: document.getElementById ("message").value,
	    delay: position});
	sendRequest.send(uri);
}


function OnSenderResponse()
{
	if(sendRequest.readyState != 4)
		return;

	if(sendRequest.status >= 200 && sendRequest.status < 300)
	{
		SetStatus("");
		document.getElementById("message").value = "";
		document.getElementById("message").focus();
		sendRequest = null;
	}
	else OnSenderError();
}


function OnSenderError()
{
	alert("Dein Post konnte nicht übertragen werden (" +
		sendRequest.status + ", '" + HtmlEscape(sendRequest.statusText) + "').<br>" +
			HtmlEscape(sendRequest.responseText));
	sendRequest = null;
}


// *****************
// *   Sonstiges   *
// *****************

function SetStatus(text)
{
    document.getElementById("status").innerHTML = text;
	var node = document.getElementById("messagebox");
	node.scrollTop = node.scrollHeight;
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
		k = decodeURIComponent(key);
		v = decodeURIComponent(value);
		vars[k] = v;
	});
	return vars;
}


function HtmlEscape (text, links)
{
	text = text.replace (/&/g, "&amp;").replace (/</g, "&lt;").replace (/>/g, "&gt;").replace (/\"/g, "&quot;");
	if (links) text = InsertLinks (text);
	return text.replace (/\n/g, "<br>");
}
