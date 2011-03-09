var last;

function Init ()
{
	if (parent != self)
		parent.InitHelp ();
	else
	{
	//%%bot-block option added
		var options = new Object ();
		options["ip"] = 1;
		options["delay"] = 1;
		options["links"] = 0;
		options["old"] = 0;
		options["last"] = 20;
		options["target"] = "_blank";
		options["botblock"] = 1;
		InitRemote (options);
	}
}

function InitRemote (options)
{
	//%%bot block option added
	document.getElementById ("ip").checked = options["ip"];
	document.getElementById ("delay").checked = options["delay"];
	document.getElementById ("links").checked = options["links"];
	document.getElementById ("old").checked = options["old"];
	document.getElementById ("last").value = count = options["last"];
	document.getElementById ("botblock").checked = options["botblock"];
        document.getElementById ("mathjax").checked = options["mathjax"];
	//document.getElementById ("links").target = options["target"];
}

function ShowIp ()
{
	if (parent != self)
		parent.ShowIp (document.getElementById ("ip").checked);	
}

function ShowDelay ()
{
	if (parent != self)
		parent.ShowDelay (document.getElementById ("delay").checked);
}

function ShowLinks ()
{
	if (parent != self)
		parent.ShowLinks (document.getElementById ("links").checked);
}

function ShowOld()
{
	if (parent != self)
		parent.ShowOld (document.getElementById ("old").checked);
}

function NotShowBot()
{
	if (parent != self)
		parent.NotShowBot (document.getElementById ("botblock").checked);
}

function ShowMathjax ()
{
    if (parent != self)
	parent.ShowMathjax (document.getElementById ("mathjax").checked);
}


function CheckSize ()
{
	var input = document.getElementById ("last");
	var value = parseInt (input.value);
	if (value == "NaN")
		input.value = last;
	else
	{
		if (value < 4)
			input.value = last = 4;
		else if (value > 1000)
			input.value = last = 1000;
		else
			input.value = last = value;

		if (parent != self)
			parent.ChangeLast (last);
	}
}

function Decrease ()
{
	var input = document.getElementById ("last");
	input.value = last = Math.max (4, parseInt (input.value) - 1);

	if (parent != self)
		parent.ChangeLast (last);
}

function Increase ()
{
	var input = document.getElementById ("last");
	input.value = last = Math.min (24, parseInt (input.value) + 1);

	if (parent != self)
		parent.ChangeLast (last);
}
