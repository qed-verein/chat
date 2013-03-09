var createRequest, request, position, from = 0, timeWait, generator = 0,zero=0;

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

function Send_Init ()
{
	if (parent != self)
		parent.InitSend (self);
	else
	{
		var options = new Object ();
		options["name"] = "";
		options["wait"] = 60;
		options["urgent"] = true;
		InitRemote (options);
	}
}

function InitRemote (options)
{
	timeWait = 6000 * options["wait"];

	document.getElementById ("name").value = options["name"];

	if (window.XMLHttpRequest)
		createRequest = function () {return new XMLHttpRequest ();};
	else if (window.ActiveXObject)
		createRequest = function () {return new ActiveXObject ("Microsoft.XMLHTTP");};
	else
		createRequest = null;
		
	if (createRequest == null)
		SetStatus ('Hm, anscheinend unterstützt dein Browser kein XMLHttpRequest-Object.');
	else
		request = null;
	
	generator = options["generator"];

    alert(createRequest);
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
				request.open ("POST", "post.php", true);
				request.setRequestHeader ("Content-Type", "application/x-www-form-urlencoded");
				request.setRequestHeader ("Content-Encoding", "utf-8");
				//%%user \neq bot
				var content = 
					"delay=" + position + "&name=" + encodeURIComponent (document.getElementById ("name").value) + "&message=" + encodeURIComponent (document.getElementById ("message").value)+"&bottag="+zero;
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
