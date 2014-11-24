var options = new Object();
var version = "1416690087"; // muss in data ebenfalls geaendert werden

var defaults = {
		channel: "", name: "",
		last: 24, botblock: 1, old: 0, ip: 0, delay: 0, links: 1, title: 1,
		layout: 'screen', skin: 'schwarz',
		limit: 256,	wait: 60,
		redirect: "http://uxul.de/redirect.php?", target: "_blank"
	};

// Initialisiere das Skript
function Init ()
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

	document.getElementsByTagName('body')[0].className = options['skin'];

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

	uri = "view.php?" + URIEncodeParameters({
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
		var container = document.getElementById("posts");
		for (var node = container.lastChild, i = 1; node != null; ++i)
		{
			var temp = node;
			node = node.previousSibling;
			if (i >= options["last"])
				container.removeChild(temp);
		}
	}

	AppendPost(document.getElementById('posts'), post);
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
	{
		var ip = document.createElement ("td");
		ip.appendChild (document.createTextNode (post["ip"]));
		ip.setAttribute ("class", "ip");
		tr.appendChild (ip);
	}

	node = document.createElement ("td");
	node.innerHTML =  NickEscape (post["name"] + ((post['anonym'] == "1") ? " (anonym)" : "") + ":");
	node.setAttribute ("class", "name");
	node.setAttribute ("style", "color:#" + PostColor(post) + ";");
	tr.appendChild (node);

	node = document.createElement ("td");
	node.innerHTML = HtmlEscape (post["message"]);
	if(options["links"]) node.innerHTML = InsertLinks(node.innerHTML);
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
	li.setAttribute('style', 'color:#' + PostColor(post));

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
	if(options['layout'] == 'mobile') container = document.createElement('li');
	else container = document.createElement('table');
	container.id = 'posts';

	var from = (options["old"] || inHistoryMode) ? 0 : Math.max(0, posts.length - options["last"]);
	for (var cursor = from; cursor != posts.length; ++cursor)
		AppendPost(container, posts[cursor]);
	var node = document.getElementById('posts');
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
	document.getElementById('logbox').getElementsByClassName('activelog')[0].className = 'inactivelog';
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
			from : document.getElementById("logFrom").value,
			to : document.getElementById("logTo").value});
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
	historyRequest = new XMLHttpRequest();
	historyPosts = Array();
	inHistoryMode = false;
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
	RenewLinks();
}

function UpdateSettings()
{
	options["ip"] = document.getElementById("ip").checked ? 1 : 0;
	options["delay"] = document.getElementById("delay").checked ? 1 : 0;
	options["links"] = document.getElementById("links").checked ? 1 : 0;
	options["old"] = document.getElementById("old").checked ? 1 : 0;
	options["botblock"] = document.getElementById("botblock").checked ? 1 : 0;

	var input = document.getElementById("last");
	var num = parseInt(input.value);
	if(isNaN(num)) num = options["last"];
	input.value = options["last"] = Math.min(Math.max(num, 1), 1000);
	RecreatePosts(inHistoryMode ? historyPosts : posts);
	RenewLinks();
}


function Decrease()
{
	var input = document.getElementById("last");
	input.value = options['last'] = Math.max(1, parseInt(input.value) - 1);
	UpdateSettings();
}

function Increase()
{
	var input = document.getElementById("last");
	input.value = options['last'] = Math.min(1000, parseInt(input.value) + 1);
	UpdateSettings();
}

function RenewLinks()
{
	var tempOptions = new Object();
	for(var i in options)
		if(options[i] != defaults[i]) tempOptions[i] = options[i];
	tempOptions['layout'] = 'screen';
	if(document.getElementById('screenlink'))
		document.getElementById('screenlink').href = '?' + URIEncodeParameters(tempOptions);
	tempOptions['layout'] = 'mobile';
	if(document.getElementById('mobilelink'))
		document.getElementById('mobilelink').href = '?' + URIEncodeParameters(tempOptions);
}


// **************
// *   Sender   *
// **************

var sendRequest, sendTimeout;

function InitSender()
{
	document.getElementById("name").value = options["name"];
	document.getElementById("name").focus();
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


function PostColor(post)
{
	return (options['skin'] != 'mylittlepony') ? post['color'] :
		(parseInt(post['color'], 16) ^ parseInt("FFFFFF", 16)).toString(16);
}

function ScrollDown()
{
	var node = document.getElementById("messagebox");
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
