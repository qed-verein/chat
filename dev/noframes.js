var options = new Object();
var version = "1413235752"; // muss in data ebenfalls geaendert werden

// Initialisiere das Skript
function Init ()
{
	options["botblock"] = 1;
	options["ip"] = 1;
	options["delay"] = 0;
	options["channel"] = "";
	options["links"] = 1;
	options["old"] = 1;
	options["last"] = 20;
	options["limit"] = 256;
	options["title"] = 1;

	options["logIp"] = 1;
	options["logDelay"] = 0;
	options["logLinks"] = 1;
	options["target"] = "_blank";

	options["patient"] = 0;

	options["name"] = "";
	options["wait"] = 60;
	userOptions();

	InitReceiver();
	InitSender();
	InitLogs();
	InitSettings();

}



// *****************
// *   Empfänger   *
// *****************


var recvAlive, recvRequest, position, textpos, posts, watchdog;

function InitReceiver()
{
	window.onerror = ErrorHandler;
	recvRequest = new XMLHttpRequest();
	posts = Array();
	position = -24;
	QueryForMessages();

	clearInterval(watchdog);
	if(options['patient'] == 0)
		watchdog = setInterval("ReceiverWatchdog()", options["wait"] * 1000);
}


// Schicke dem Server eine Anfrage, ob neue Nachrichten angekommen sind.
function QueryForMessages()
{
	recvRequest.onreadystatechange = null;
	recvRequest.abort();

	textpos = 0;
	recvAlive = false;

	uri = "../viewneu.php?" + URIQueryParameters({
	    channel: options["channel"], position: position, limit: options["limit"],
	    version: version, type: 'json', feedback: 1});
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
		recvAlive = true;
	}

	if(recvRequest.readyState == 4)
		setTimeout("QueryForMessages()", options["wait"] * 1000);
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

	CreatePost (post);

	if (options["title"])
		top.document.title = (post["message"].length < 256) ? post["message"] :
			top.document.title = post["message"].substr(0, 252) + "...";

	SetStatus("");
}

// Zeige eine Nachricht im Chatfenster an
function CreatePost (post)
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

	document.getElementById ("display").appendChild (tr);

	node = document.getElementById("messagearea");
	node.scrollTop = node.scrollHeight;
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

// Wird in einem regelmäßigen Intervall aufgerufen, um zu für prüfen, ob die Verbindung noch lebt
function ReceiverWatchdog()
{
	if(recvAlive)
		recvAlive = false;
	else
	{
		SetStatus("Verbindung unterbrochen. Erstelle neue Verbindung mit dem Server ...");
		QueryForMessages();
	}
}

function ErrorHandler(description, filename, line)
{
	message = "Ein Fehler trat auf:<br>";
	message += HtmlEscape(description) + "<br>";
	message += "In Datei " + filename + ", Zeile " + line + ".<br>";
	message += "Bitte Seite neu laden. (Unter Firefox Strg+Shift+R).";
	SetStatus(message);
	clearInterval(watchdog);
	recvRequest.onreadystatechange = null;
	recvRequest.abort();
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
	sendRequest.timeout = 10000;
	sendRequest.onreadystatechange = OnSenderResponse;
	sendRequest.ontimeout = OnSenderResponse;
	sendRequest.open("POST", "../post.php", true);
	sendRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	sendRequest.setRequestHeader("Content-Encoding", "utf-8");

	uri = URIQueryParameters({
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
	}
	else
	{
		alert("Dein Post konnte nicht übertragen werden (" +
			sendRequest.status + ", '" + HtmlEscape(sendRequest.statusText) + "').<br>" +
				HtmlEscape(sendRequest.responseText));
	}

	sendRequest = null;
}



// *****************
// *   Sonstiges   *
// *****************

function SetStatus(text)
{
    document.getElementById("status").innerHTML = text;
	var node = document.getElementById("messagearea");
	node.scrollTop = node.scrollHeight;
}

function URIQueryParameters(params)
{
	var result = [];
	for(var key in params)
		result.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
	return result.join("&");
}

function HtmlEscape (text, links)
{
	text = text.replace (/&/g, "&amp;").replace (/</g, "&lt;").replace (/>/g, "&gt;").replace (/\"/g, "&quot;");
	if (links) text = InsertLinks (text);
	return text.replace (/\n/g, "<br>");
}
