var request;
var cursor = 0;
var numTries = 0;
var posts = new Array ();
var position = -1;
var options;
var from = 0;
var noXml;
var timeWait;

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
		options["ip"] = 0;
		options["delay"] = 0;
		options["links"] = 1;
		options["old"] = 0;
		options["last"] = 20;
	        // this redirect-setting is ignored
		options["redirect"] = "http:www.stud.uni-muenchen.de/~christian.sattler/redirect.html?";
		options["limit"] = "256";
		options["patient"] = false;
		options["method"] = "detect";
		options["wait"] = 10;
		options["target"] = "_blank";
		options["urgent"] = true;
		InitRemote (options);
	}
	

	if (options["urgent"] && !noXml) {
		var r = new XMLHttpRequest();
		r.open("GET", "http://uxul.org/upload/urgent.txt", false);
		r.send(null);
		var text = r.responseText;
	
		var node = document.createElement("div");
		node.innerHTML = HtmlEscape(text, options["links"]);
		node.setAttribute("style", "position: absolute; right: 0px; bottom: 0px; font-weight: bold; color: #ff0000");
		document.getElementsByTagName("body")[0].appendChild(node);
	}
}

function Debug (message)
{
	var post = new Object ();
	post["id"] = 0;
	post["name"] = "Debug";
	post["message"] = message;
	post["date"] = "";
	post["ip"] = "";
	post["delay"] = "";
	post["color"] = "FFFFFF";
	CreatePost (post);
}

function InitRemote (opt)
{
	options = opt;
	(window.XMLHttpRequest ? false : true);
	
	timeWait = 1000 * options["wait"];
	
	if (options["method"] == "xml")
		noXml = false;
	else if (options["method"] == "iframe")
		noXml = true;
	else
		noXml = (window.XMLHttpRequest ? false : true);

	if (noXml)
		document.body.innerHTML += '<iframe id="iframe" style="border:0px; width:0px; height:0px;"></iframe>';
	else
		request = new XMLHttpRequest ();

	Receive ();
}

function MsieCheck ()
{
	if (document.getElementById ("iframe").readyState == "complete")
	{
		clearInterval (msieInterval);
		Disconnected ();
	}
}

function Receive ()
{
	SetStatus ("Verbindung wird hergestellt (" + ++numTries + ". Versuch) ...");
	ReceiveInternal ();
}

function ReceiveInternal ()
{
	if (noXml)
		ReceiveNoXml ();
	else
		ReceiveXml ();
}

function ReceiveNoXml ()
{
	var iframe = document.getElementById ("iframe");
	iframe.src = "view.php?type=html&feedback=1&position=" + position + "&limit=" + options["limit"] + (options["unl33t"] != 0 ? "&unl33t=1" : "");
	msieInterval = setInterval ("MsieCheck ()", 500);
}

function ReceiveXml ()
{
	cursor = 0;
	request.onreadystatechange = StateChanged;
	request.open ("GET", "view.php?type=javascript&feedback=1&position=" + position + "&limit=" + options["limit"] + (options["unl33t"] != 0 ? "&unl33t=1" : ""), true);
	request.send ("");
	if (!options["patient"])
		setTimeout ("OnTimeout (" + from + ")", timeWait);
}

function StateChanged ()
{
	if (request.readyState >= 3)
	{
		var next;
		while ((next = request.responseText.indexOf (";", cursor) + 1) != 0)
		{
			eval (request.responseText.substring (cursor, next));
			cursor = next;
		}
		
		if (request.readyState == 4)
			Disconnected ();
	}
}

function OnTimeout (to)
{
	if (from == to)
		Disconnected ();
}

function Disconnected ()
{
	request.abort ();
	if (numTries == 3)
	{
		SetStatus ("Verbindung konnte in drei Versuchen nicht hergestellt werden.<br>Hast du es schon mit <a href=\"index.php?patient=true&limit=1\" target=\"" + options["target"] + "\">index.php?patient=true&limit=1</a> versucht?");
		top.document.title = "Fehler: Chat-Server konnte nicht erreicht werden.";
	}
	else
		Receive ();
}

function Ok ()
{
	SetStatus ("");
	numTries = 0;

	if (!noXml)
		++from;
}

function SpawnError (number, description, file, line)
{
	SetStatus ("Ein Verbindungsfehler trat auf:<br>(" + number + ", " + HtmlEscape (description, false) + ", " + file + ", " + line + ")<br>Verbinde erneut ...");
	request.abort ();
	ReceiveInternal ();
}

function InsertLinks (text)
{
	return text.replace (/(https:\/\/|http:\/\/|ftp:\/\/)([\w\&.~%\/?#=@:\[\]+\$\,-]*)/g, '<a href="' + options["redirect"] + '$1$2" target="' + options["target"] + '">$1$2</a>');
}

function GetNodeIp (post)
{
	node = document.createElement ("td");
	node.appendChild (document.createTextNode (post["ip"]));
	node.setAttribute ("class", "ip");
	return node;
}

function HtmlEscape (text, links)
{
	text = text.replace (/&/g, "&amp").replace (/</g, ";&lt").replace (/>/g, ";&gt").replace (/\"/g, ";&quot");
	if (links)
		text = InsertLinks (text);
	text = text.replace (/&amp/g, "&amp;").replace (/;&lt/g, "&lt;").replace (/;&gt/g, "&gt;").replace (/;&quot/g, "&quot;");
	return text.replace (/\n/g, "<br>");
}

function CreatePost (post)
{

	var tr = document.createElement ("tr");

	var info = post["date"].substr (5);
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
	node.innerHTML = HtmlEscape (post["name"], options["links"]) + ":";
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

function AddPost (id, name, message, date, ip, delay, color, bottag)
{

	/*************************CSSMOD*********************/
	if (message == "PING") {}
	else 

	if (id > position)
	{
		if (position != -1 && id != position + 1)
			alert ("Fehler des Chat-Systems");
		else
		{
			position = id;

			var post = new Object ();
			post["id"] = id - 1;
			post["name"] = decodeURIComponent (name);
			post["message"] = decodeURIComponent (message);
			post["date"] = date;
			post["ip"] = ip;
			post["delay"] = delay;
			post["color"] = color;
			posts.push (post);
			
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
			
			if (options["sound"])
				if (parent != self)
					parent.send.document.getElementById ("sound").innerHTML = '<embed src="' + options["sound_post"] + '" hidden=true autostart=true loop=false>';
				else
					document.getElementById ("sound").innerHTML = '<embed src="' + options["sound_post"] + '" hidden=true autostart=true loop=false>';
		}
	}
}

function RecreatePosts ()
{
	var display = document.getElementById ("display");
	while (display.hasChildNodes ())
		display.removeChild (display.lastChild);

	for (var cursor = (options["old"] ? 0 : Math.max (0, posts.length - options["last"])); cursor != posts.length; ++cursor)
		CreatePost (posts[cursor]);
}

function ShowMathjax (value)
{
    options["mathjax"] = value;
    RecreatePosts ();
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

function EnableSound (value)
{
	options["sound"] = value;
}
