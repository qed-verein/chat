var sendLoaded = false;
var helpLoaded = false;
var logsLoaded = false;
var recvLoaded = false;

function InitSend (bla)
{
	sendLoaded = true;
	bla.InitRemote (options);
}

function InitHelp ()
{
	helpLoaded = true;
	help.InitRemote (options);
}

function InitLogs ()
{
	logsLoaded = true;
	logs.InitRemote (options);
}

function InitRecv ()
{
	recvLoaded = true;
	recv.InitRemote (options);
}

function SetPosition (value)
{
	setTimeout ("send.SetPosition (" + value + ")", 500);
}

function NotShowBot(value)
{
		recv.NotShowBot (value);
}

function ShowIp (value)
{
	recv.ShowIp (value);
}

function ShowDelay (value)
{
	recv.ShowDelay (value);
}

function ShowLinks (value)
{
	recv.ShowLinks (value);
}

function ShowOld (value)
{
	recv.ShowOld (value);
}

function ChangeLast (value)
{
	recv.ChangeLast (value);
}
