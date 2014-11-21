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
	InitLogs();
	InitSettings();
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

	uri = "view.php?" + URIEncodeParameters({
	    channel: options["channel"], position: position, limit: options["limit"],
	    version: version, keepalive: Math.ceil(options["wait"] / 2)});
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

	if(options['botblock'] && post['bottag'] == '1')
		return;

	if(options['mobile'])
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
	if (options["delay"])
		info = DelayString(post) + info;

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

	var date = document.createElement('span');
	date.setAttribute('class', 'date');
	date.appendChild(document.createTextNode(post['date']));

	var ip = document.createElement('span');
	ip.appendChild(document.createTextNode("[" + post['ip'] + "]"));
	ip.setAttribute('class', 'ip');

	var delay = document.createElement('span');
	delay.appendChild(document.createTextNode(DelayString(post)));
	delay.setAttribute('class', 'delay');

	var info = document.createElement('span');
	info.setAttribute('class', 'info');
	info.appendChild(date);
	if(options['ip'])
		info.appendChild(ip);
	if(options['delay'])
		info.appendChild(delay);
	li.appendChild(info);

	var message = document.createElement('span');
	message.innerHTML = HtmlEscape(post['message'], options['links']);
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
	var display = document.getElementById("display");
	while (display.hasChildNodes())
		display.removeChild(display.lastChild);

	var from = (options["old"] ? 0 : Math.max(0, posts.length - options["last"]));
	for (var cursor = from; cursor != posts.length; ++cursor)
		CreatePost(posts[cursor]);
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

var historyRequest;

function ShowHistory(elt)
{
	parameters = "&" + URIEncodeParameters({version: version});
	url = "history.php?";

	if(elt.id == 'lastHour')
		url += URIEncodeParameters({from: '-1 hour', to: '+0 sec'});
	else if(elt.id == 'lastDay')
		url += URIEncodeParameters({from: '-1 day', to: '+0 sec'});
	else if(elt.id == 'lastWeek')
		url += URIEncodeParameters({from: '-7 day', to: '+0 sec'});
	else if(elt.id == 'last100')
		url += URIEncodeParameters({last: '100'});
	else if(elt.id == 'last300')
		url += URIEncodeParameters({last: '300'});
	else if(elt.id == 'last1000')
		url += URIEncodeParameters({last: '1000'});
	url += parameters;

	historyRequest.onreadystatechange = OnHistoryResponse;
	historyRequest.open('GET', url, true);
	historyRequest.send();
}

// Wird aufgerufen, falls der Server eine Antwort geschickt hat.
function OnHistoryResponse()
{
	if(historyRequest.readyState != 4) return;
	if(historyRequest.status < 200 || historyRequest.status >= 300) return;

	var hposts = Array();
	var lines = historyRequest.responseText.split("\n");
	for(var index in lines)
	{
		alert(lines[index]);
		obj = JSON.parse(lines[index]);
		if(obj["type"] == "post")
			hposts.push(obj);
		else if(obj["type"] == "error")
			throw new Error(obj["description"], obj["file"], obj["line"]);
	}

	RecreatePosts(hposts);
	SetStatus("");
}

function RenewLinks()
{
	//parameters = "&" + URIEncodeParameters({version: version});
	//"&ip=" + (document.getElementById ("logIp").checked ? 1 : 0)
		//+ "&delay=" + (document.getElementById ("logDelay").checked ? 1 : 0)
		//+ "&links=" + (document.getElementById ("logLinks").checked ? 1 : 0);

	//document.getElementById("lastHour").href = "history.php?" +
		//URIEncodeParameters({from: '-1 hour', to: '+0 sec'}) + parameters;
	//document.getElementById("lastDay").href = "history.php?" +
		//URIEncodeParameters({from: '-1 day', to: '+0 sec'}) + parameters;
	//document.getElementById("lastWeek").href = "history.php?" +
		//URIEncodeParameters({from: '-7 day', to: '+0 sec'}) + parameters;


	//document.getElementById("last100").href = "history.php?last=100" + parameters;
	//document.getElementById("last300").href = "history.php?last=300" + parameters;
	//document.getElementById("last1000").href = "history.php?last=1000" + parameters;

	//document.getElementById("log").href = "history.php?" + URIEncodeParameters({
		//from : document.getElementById("logFrom").value,
		//to : document.getElementById("logTo").value}) + parameters;

}


function InitLogs()
{
	historyRequest = new XMLHttpRequest();

	//document.getElementById("lastHour").target = options["target"];
	//document.getElementById("lastDay").target = options["target"];
	//document.getElementById("lastWeek").target = options["target"];

	//document.getElementById("last100").target = options["target"];
	//document.getElementById("last300").target = options["target"];
	//document.getElementById("last1000").target = options["target"];

	//document.getElementById("log").target = options["target"];

	RenewLinks();
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
	RecreatePosts(posts);
}


function Decrease()
{
	var input = document.getElementById("last");
	input.value = options['last'] = Math.max(1, parseInt(input.value) - 1);
	RecreatePosts(posts);
}

function Increase()
{
	var input = document.getElementById("last");
	input.value = options['last'] = Math.min(1000, parseInt(input.value) + 1);
	RecreatePosts(posts);
}


// **************
// *   Sender   *
// **************

var sendRequest, sendTimeout;

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
	sendRequest = new XMLHttpRequest();
	sendRequest.onreadystatechange = OnSenderResponse;
	sendRequest.open("POST", "post.php", true);
	sendRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	sendRequest.setRequestHeader("Content-Encoding", "utf-8");

	sendTimeout = setTimeout("OnSenderError()", options["wait"] * 1000);

	uri = URIEncodeParameters({
	    channel: options["channel"],
	    name: document.getElementById ("name").value,
	    message: document.getElementById ("message").value,
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
		document.getElementById("message").value = "";
		document.getElementById("message").focus();
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
