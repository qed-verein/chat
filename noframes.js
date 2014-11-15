var version = "1413235752"; // muss in data ebenfalls geaendert werden

var request;
var cursor = 0;
var reconnect = true;
var posts = new Array();
var position = -24;
var options = new Object ();


var reconnect = true; /* reconnect after call of Disconnect ()? Set to false by SpawnError. */

function SetStatus (text)
{
    document.getElementById ("status").innerHTML = text;
    scrollBy (0, 999999);
}

function Init ()
{
	options["botblock"] = 1;
	options["ip"] = 1;
	options["delay"] = 1;
	options["channel"] = "";
	options["links"] = 1;
	options["old"] = 0;
	options["last"] = 20;
	options["limit"] = "256";
	options["title"] = "1";

	options["logIp"] = 1;
	options["logDelay"] = 0;
	options["logLinks"] = 1;
	options["target"] = "_blank";
	InitReceiver();
	InitLogs();
}

// Initialisiere das Skript
function InitReceiver()
{
	window.onerror = ErrorHandler;
	request = new XMLHttpRequest();
	QueryForMessages();
}


// Schicke dem Server eine Anfrage, ob neue Nachrichten angekommen sind.
function QueryForMessages()
{
	cursor = 0;
	uri = "viewneu.php?channel=" + options["channel"] +
		"&position=" + position + "&limit=" + options["limit"] +
		"&version=" + version + "&type=json&feedback=1";

	request.onreadystatechange = ServerResponse;
	request.open('GET', uri, true);
	request.send();
}

// Wird aufgerufen, falls der Server eine Antwort geschickt hat.
function ServerResponse()
{
	if(request.readyState < 3)
		return;

    var end, obj;
    while((end = request.responseText.indexOf(";", cursor)) >= 0)
    {
		obj = $.parseJSON(request.responseText.substring(cursor, end));

		if(obj["type"] == "post")
			ProcessPost(obj);
		else if(obj["type"] == "error")
			throw new Error(obj["description"], obj["file"], obj["line"]);
		else if(obj["type"] != "ok")
			throw new Error("Unknown Type");

		SetStatus("");
		cursor = end + 1;
	}

	if(request.readyState == 4 && reconnect)
		setTimeout("QueryForMessages()", 10000);
}

// Wird für jede ankommende Nachricht aufgerufen
function ProcessPost(post)
{
	if(post['id'] < position)
		return;

	position = post['id'] + 1;
	post['name'] = decodeURIComponent(post['name']) + ((post['anonym'] == "1") ? " (anonym)" : "");
	post['message'] = decodeURIComponent(post['message']);
	posts.push(post);

	if (parent != self)
		parent.SetPosition (position);

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
		if (post["message"].length < 256)
			top.document.title = post["message"];
		else
			top.document.title = post["message"].substr (0, 252) + "...";

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
        node.innerHTML =  NickEscape (post["name"] + ":");
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

	for (var cursor = (options["old"] ? 0 : Math.max (0, posts.length - options["last"])); cursor != posts.length; ++cursor)
		CreatePost (posts[cursor]);
}


function ErrorHandler(description, filename, line)
{
	message = "Ein Fehler trat auf:<br>";
	message += HtmlEscape(description, false) + "<br>";
	message += "In Datei " + filename + ", Zeile " + line + ".<br>";
	message += "Bitte Seite neu laden. (Unter Firefox Strg+Shift+R).";
	SetStatus(message);
	reconnect = false;
	request.abort();
	return false;
}

function InsertLinks (text)
{
	return text.replace (/(https:\/\/|http:\/\/|ftp:\/\/)([\w\&.~%\/?#=@:\[\]+\$\,-;]*)/g,
			     '<a rel="noreferrer" target="_blank" href="$1$2">$1$2</a>');
    /*return text.replace (/(https:\/\/|http:\/\/|ftp:\/\/)([\w\&.~%\/?#=@:\[\]+\$\,-;]*)/g,
			     '<a rel="noreferrer" target="_blank" href=\'data:text/html;charset=utf-8, <html><meta http-equiv="refresh" content="0;URL=&#39;$1$2&#39;">$1$2</html>\'>$1$2</a>');*/

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

















function GetValue (value)
{
	var temp = parseInt (value);
	if (isNaN (temp))
		return "";
	else
		return temp;
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

	document.getElementById ("lastHour").href = "history.php?from=-60" + parameters;
	document.getElementById ("thisDay").href = "history.php?from=0_0" + parameters;
	document.getElementById ("lastDay").href = "history.php?from=0_-24" + parameters;
	document.getElementById ("threeDays").href = "history.php?from=0_-72" + parameters;

	document.getElementById ("last100").href = "history.php?last=100" + parameters;
	document.getElementById ("last200").href = "history.php?last=200" + parameters;
	document.getElementById ("last500").href = "history.php?last=500" + parameters;
	document.getElementById ("last1000").href = "history.php?last=1000" + parameters;

	document.getElementById ("log").href = "history.php?" + "from=" + GetDateString ("fr") + "&to=" + GetDateString ("to") + parameters;
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
