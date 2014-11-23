var createRequest, request, channel, position, from = 0, timeWait, generator = 0,zero=0;
var options;

function GetKey (gen)
{
	var genString = gen.toString (16);
	while (genString.length != 8)
		genString = "0" + genString;

	var string = genString
		+ parent.recv.document.getElementById ("display").name
		+ document.getElementById ("hiddenHook")
		+ document.title
		+ parent.help.document.entity;
	return genString + DoWhateverNeedToBeDone (string);
}

function SetStatus (text)
{
	document.getElementById ("status").innerHTML = text;
}

function Init ()
{
	if (parent != self)
		parent.InitSend (self);
	else
	{
		options = new Object ();
		options["name"] = "";
		options["wait"] = 60;
		options["urgent"] = true;
		options["channel"] = "";
		InitRemote (options);
	}
}

function InitRemote (opt)
{
	options = opt;
	timeWait = 6000 * options["wait"];

	channel = options["channel"];

	document.getElementById ("name").value = options["name"];

	if (window.XMLHttpRequest)
		createRequest = function () {return new XMLHttpRequest ();};
	else if (window.ActiveXObject)
		createRequest = function () {return new ActiveXObject ("Microsoft.XMLHTTP");};
	else
		createRequest = null;

	if (createRequest == null)
		SetStatus ('Hm, anscheinend unterstützt dein Browser kein XMLHttpRequest-Object.<br>Probiere doch einfach mal <a href="bla.html">dieses</a> Interface.');
	else
		request = null;

	generator = options["generator"];

	/* if (options["urgent"] && window.XMLHttpRequest) {
		var r = new XMLHttpRequest();
		r.open("GET", "http://uxul.org/upload/urgent.txt", false);
		r.send(null);
		var text = r.responseText;

		document.getElementById ("message").value = text;
	}
*/
}

function SetPosition (value)
{
	position = value;
}

function StateChanged ()
{
	if (request.readyState == 4)
	{
		if (request.status >= 200 && request.status < 300)
		{
			SetStatus ("");
			var
			message = document.getElementById ("message");
			message.value = "";
			message.focus ();
		}
		else
			SetStatus ("Dein Post konnte nicht übertragen werden (" + request.status + ", " + request.statusText + ").<br>" + request.responseText);

		request = null;
		++from;
	}
}

function OnTimeout (to)
{
	if (from == to)
	{
		SetStatus ("Der Server antwortete nicht innerhalb von " + (timeWait / 1000) + " Sekunden auf deine Postsendung.");

		request.abort ();
		request = null;
	}
}

function Send ()
{
	if (createRequest != null) {
		if (request == null)
			{
				SetStatus ("Sende Post ...");
				request = createRequest ();
				request.onreadystatechange = StateChanged;
				request.open ("POST", "../noframes/post.php", true);
				request.setRequestHeader ("Content-Type", "application/x-www-form-urlencoded");
				request.setRequestHeader ("Content-Encoding", "utf-8");
				//%%user \neq bot
				//alert(options["channel"]);
				var content =
					"delay=" + position + "&channel=" + channel + "&name=" + encodeURIComponent (document.getElementById ("name").value) + "&message=" + encodeURIComponent (document.getElementById ("message").value)+"&bottag="+zero+"&version="+options['version'];
				if (generator)
					content += "&key=" + GetKey (generator++);
				request.send (content);
				setTimeout ("OnTimeout (" + from + ")", timeWait);
			}
		else
			SetStatus ("Dein alter Post wird noch gesendet ...");
	}
	else
	    alert("createrequest ist put");
}
