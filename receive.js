var version = "1413235752"; // muss in data ebenfalls geaendert werden
var options;

function SetStatus (text)
{
    document.getElementById ("status").innerHTML = text;
    scrollBy (0, 999999);
}

function Init ()
{
	if (parent != self)
		parent.InitRecv ();
	else
	{
		var options = new Object ();
		options["botblock"] = 1;
		options["ip"] = 1;
		options["delay"] = 1;
		options["channel"] = "";
		options["links"] = 1;
		options["old"] = 0;
		options["last"] = 20;
		options["limit"] = "256";
		options["title"] = "1";

		InitRemote (options);
	}
}


// *****************
// *   Empfänger   *
// *****************


var firstReconnect, recvRequest, position, textpos, posts, timeout;

function InitRemote (opt)
{
	options = opt;

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

	uri = "../viewneu.php?" + URIQueryParameters({
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
	send.SetPosition(position);
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

    scrollBy (0, 999999);
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



function HtmlEscape (text, links)
{
	text = text.replace (/&/g, "&amp;").replace (/</g, "&lt;").replace (/>/g, "&gt;").replace (/\"/g, "&quot;");
	if (links) text = InsertLinks (text);
	return text.replace (/\n/g, "<br>");

}

function ShowIp (value)
{
	options["ip"] = value;
	RecreatePosts ();
}

function ShowDelay (value)
{
	options["delay"] = value;
	RecreatePosts ();
}

function ShowLinks (value)
{
	options["links"] = value;
	RecreatePosts ();
}

function NotShowBot (value)
{
	options["botblock"] = value;
	RecreatePosts ();
}

function ShowOld (value)
{
	options["old"] = value;
	RecreatePosts ();
}

function ChangeLast (value)
{
	options["last"] = value;
	RecreatePosts ();
}



function URIQueryParameters(params)
{
	var result = [];
	for(var key in params)
		result.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
	return result.join("&");
}
