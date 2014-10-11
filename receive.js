var request;
var cursor = 0;
var numTries = 0;
var posts = new Array ();
var position = -24;
var options;
var from = 0;
//var noXml; /* TODO: Kein Mensch verwendet das mehr! */
var timeWait;
var lastposition = -1;

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
        options["laghack"] = false;
		options["links"] = 1;
		options["old"] = 0;
		options["last"] = 20;
		options["limit"] = "256";
		options["patient"] = false;
	        options["method"] = "detect";
		options["wait"] = 10;
		options["urgent"] = true;
		InitRemote (options);
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
	//(window.XMLHttpRequest ? false : true); was soll das tun?

	timeWait = 1000 * options["wait"];

	/*if (options["method"] == "xml")
		noXml = false;
	else if (options["method"] == "iframe")
		noXml = true;
	else
		noXml = (window.XMLHttpRequest ? false : true);

	if (noXml)
		document.body.innerHTML += '<iframe id="iframe" style="border:0px; width:0px; height:0px;"></iframe>';
	else*/
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
//	fgci SetStatus ("Verbindung wird hergestellt (" + ++numTries + ". Versuch) ...");
    ++numTries; /* gute guete wie fuerchterlich ist dieser code ... */
    ReceiveInternal ();
}

function ReceiveInternal ()
{
    /*if (noXml) {
	    var iframe = document.getElementById ("iframe");
	    iframe.src = "view.php?type=html&feedback=1&position=" + position + "&limit=" + options["limit"] + (options["unl33t"] != 0 ? "&unl33t=1" : "");
	    msieInterval = setInterval ("MsieCheck ()", 500);

	} else {*/
		limitParameter = (position <= 0) ? 24 : options["limit"];
	    cursor = 0;
	    request.onreadystatechange = StateChanged;
	    request.open ("GET", "viewneu.php?type=json&feedback=1&channel=" + options["channel"] + "&position=" + position + "&limit=" + limitParameter  + (options["unl33t"] != 0 ? "&unl33t=1" : "") + (options["laghack"] ? "&laghack=1" : ""), true);
	    request.send ("");
	    if (!options["patient"])
		setTimeout ("OnTimeout (" + from + ")", timeWait);
	//}
}

function StateChanged ()
{
	if (request.readyState >= 3)
	{
	    var next, p;
	    while ((next = request.responseText.indexOf (";", cursor) + 1) != 0)
	    {
		try {
		    p = $.parseJSON(request.responseText.substring (cursor, next - 1));
		} catch (e) {
		    SpawnError (91923, "Invalid JSON: " + request.responseText.substring (cursor, next - 1), "receive.js", 131);
		    break;
		}

		if (p["type"] == "ok") {
		    Ok ();
		} else if (p["type"] == "error") {
		    SpawnError(p["number"], p["description"], p["file"], p["line"]);
		} else if (p["type"] == "post") {
		    AddPost(p["id"], p["name"] + ((p["anonym"] == "1") ? " (anonym)" : ""),
			    p["message"], p["date"], p["ip"], p["delay"],
			    p["color"], p["bottag"]);
		} else {
		    SpawnError(91922, "Unknown Type", "receive.js", 139);
		}
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
	/*if (numTries == 3)
	{
		SetStatus ("Verbindung konnte in drei Versuchen nicht hergestellt werden.<br>Hast du es schon mit <a href=\"index.php?patient=true&limit=1\" target=\"" + options["target"] + "\">index.php?patient=true&limit=1</a> versucht?");
		top.document.title = "Fehler: Chat-Server konnte nicht erreicht werden.";
	}
	else*/
    setTimeout("Receive ()", 10000);
}

function Ok ()
{
	SetStatus ("");
	numTries = 0;

/*	if (!noXml)
		++from;*/
}

function SpawnError (number, description, file, line)
{
	SetStatus ("Ein Verbindungsfehler trat auf:<br>(" + number + ", " + HtmlEscape (description, false) + ", " + file + ", " + line + ")<br>Warte 10 Sekunden und verbinde erneut ...");
	request.abort ();

    // hat sich auch in einem endlessloop verfangen - CSS
	setTimeout("ReceiveInternal ()", 10000);
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
	//text = text.replace (/&/g, "&amp").replace (/</g, ";&lt").replace (/>/g, ";&gt").replace (/\"/g, ";&quot");
    //text = text.replace ("]]>", "]]]]><![CDATA[>");
	if (links)
		text = InsertLinks (text);
	//text = text.replace (/&amp/g, "&amp;").replace (/;&lt/g, "&lt;").replace (/;&gt/g, "&gt;").replace (/;&quot/g, "&quot;");
	//text = text.replace (/ /g,"&nbsp;");
	return text.replace (/\n/g, "<br>");

}


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

function AddPost (id, name, message, date, ip, delay, color, bottag)
{
//%%bottag added
	/**************************************CSSHACK****************************/
	if (id >= position || position <= 0)
	{
		/*if (position != -1 && id != position + 1)
			alert ("Fehler des Chat-Systems");
		else
		{*/
			position = id + 1;

			var post = new Object ();
			post["id"] = id;
			post["name"] = decodeURIComponent (name);
			post["message"] = decodeURIComponent (message);
			post["date"] = date;
			post["ip"] = ip;
			post["delay"] = delay;
			post["color"] = color;
			post["bottag"] = bottag;
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

	}
}

function PingTimeout (lastpos)
{
	if (position == lastpos) {
		Disconnected();}
}

function RecreatePosts ()
{
	var display = document.getElementById ("display");
	while (display.hasChildNodes ())
		display.removeChild (display.lastChild);

	for (var cursor = (options["old"] ? 0 : Math.max (0, posts.length - options["last"])); cursor != posts.length; ++cursor)
		CreatePost (posts[cursor]);
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
