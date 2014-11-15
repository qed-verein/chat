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
}

function ShowIp ()
{
	options["ip"] = document.getElementById("ip").checked;
	RecreatePosts();
}

function ShowDelay ()
{
	options["delay"] = document.getElementById("delay").checked;
	RecreatePosts();
}

function ShowLinks ()
{
	options["links"] = document.getElementById("links").checked;
	RecreatePosts();
}

function ShowOld()
{
	options["old"] = document.getElementById("old").checked;
	RecreatePosts();
}

function NotShowBot()
{
	options["botblock"] = document.getElementById("botblock").checked;
	RecreatePosts();
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

		options["last"] = last;
		RecreatePosts ();
	}
}

function Decrease ()
{
	var input = document.getElementById ("last");
	input.value = last = Math.max (4, parseInt (input.value) - 1);

	options["last"] = last;
	RecreatePosts ();
}

function Increase ()
{
	var input = document.getElementById ("last");
	input.value = last = Math.min (24, parseInt (input.value) + 1);

	options["last"] = last;
	RecreatePosts ();
}
