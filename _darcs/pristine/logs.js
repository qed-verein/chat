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
	document.getElementById ("threeDays").href = "history.php?from=0_-48" + parameters;

	document.getElementById ("last100").href = "history.php?last=100" + parameters;
	document.getElementById ("last200").href = "history.php?last=200" + parameters;
	document.getElementById ("last500").href = "history.php?last=500" + parameters;
	document.getElementById ("last1000").href = "history.php?last=1000" + parameters;

	document.getElementById ("log").href = "history.php?" + "from=" + GetDateString ("fr") + "&to=" + GetDateString ("to") + parameters;
}

function Init ()
{
	if (parent != self)
		parent.InitLogs ();
	else
	{
		var options = new Object ();

		options["logIp"] = 1;
		options["logDelay"] = 0;
		options["logLinks"] = 1;
		options["target"] = "_blank";
		InitRemote (options);
	}
}

function InitRemote (options)
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
