var options = new Object();

// muss in rubychat ebenfalls geaendert werden
// use date -u +%Y%m%d%H%M%S
var version = "20171030131648"; 

var recvPart, sendPart, confPart, logsPart;
var notification, isActive = true, unreadCount = 0, selectcount = 0;
var messageCache = [];

var themecolors = { 'dunkelgrauton' : "#555" , 'schwarzwiedienacht' :"#010101" , 'mylittlepony': "#f6b7d2",
	'apfelweiss': "#ddd", };

var defaults = {
		channel: "", name: "",
		last: 24, botblock: 0, old: 0, publicid: 0, delay: 0, links: 1, title: 1, math: 0, showids: 4,
		notifications: 1, favicon: 1,
		layout: 'screen', skin: 'dunkelgrauton',
		limit: 256,	wait: 1
	};


function LoadOptions()
{
	integerOptions = ['last', 'limit', 'wait', 'showids'];
	booleanOptions = ['botblock', 'old', 'publicid', 'delay', 'links', 'title', 'math', 'notifications', 'favicon'];
	params = URIDecodeParameters();
	for(var key in defaults)
	{
		options[key] = params.hasOwnProperty(key) ? params[key] : defaults[key];
		if(integerOptions.indexOf(key) >= 0)
			options[key] = parseInt(options[key]);
		if(booleanOptions.indexOf(key) >= 0)
			options[key] = parseInt(options[key]) ? 1 : 0;
	}

	recvPart = sendPart = confPart = logsPart = document;

}

function OptionURL()
{
	var tempOptions = new Object();
	for(var i in options)
		if(options[i] != defaults[i]) tempOptions[i] = options[i];
	url = URIEncodeParameters(tempOptions);
	return url;
}


// Initialisiere das Skript
function Init()
{
	LoadOptions();
	if(!ReadCookie('userid')) document.location.href = "account.html?"  + OptionURL();

	window.onerror = ErrorHandler;
	window.onunload = SocketDisconnect;
	
	InitSocket();
	InitSettings();
	InitNotifications();
}

// *****************
// *   Socket   *
// *****************

var firstReconnect, webSocket, position, textpos, posts, timeout, pingTimer, wait;
var pendingPongs;

function InitSocket()
{
	position = -24;
	posts = Array();
	RecreatePosts();
	sendPart.getElementById("name").value = options["name"];
	sendPart.getElementById("message").focus();

	firstReconnect = true;
	wait = options['wait'];
	window.addEventListener("online", SocketConnect);

	SocketConnect();
}

function SocketConnect()
{
	SocketDisconnect();
	SetReconnect(0, "");
	if(!firstReconnect)
		SetStatus("Verbindung unterbrochen. Erstelle neue Verbindung mit dem Server...");

	protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
	uri = protocolPrefix + "//" + location.hostname + "/websocket?" + URIEncodeParameters({channel: options["channel"], position: position});
	//uri = "ws://localhost:21000/?" + URIEncodeParameters({channel: options["channel"], position: position});
	webSocket = new WebSocket(uri);
	webSocket.onmessage = OnSocketResponse;
	webSocket.onerror = OnSocketError;
	webSocket.onopen = OnSocketOpen;
	webSocket.onerror = OnSocketError;
	webSocket.onclose = OnSocketClose;
}

function SocketDisconnect()
{
	clearTimeout(timeout);
	clearInterval(pingTimer);
	if(webSocket)
		webSocket.close();
}

function OnSocketOpen(event)
{
	SetStatus("");
	pingTimer = setInterval(Ping, 30 * 1000);

	if(messageCache.length != 0)
	{
		SetStatus("Es werden noch " + messageCache.length + " Posts gesendet");
		for(var message in messageCache.reverse())
		{
			if(webSocket.readyState == 1)
				webSocket.send(message);
		}
	}
}

function OnSocketResponse(event)
{	
	firstReconnect = true;
	wait = options['wait'];
	obj = JSON.parse(event.data);
	switch(obj['type'])
	{
		case "post":
			ProcessPost(obj);
			break;
		case "pong":
			pendingPongs = 0;
			break;
	}
}

function OnSocketError(event)
{
	if(!firstReconnect)
		SetStatus("Es ist ein Fehler aufgetreten!");
}

function OnSocketClose(event)
{
	if(event.code == 1000)
		return;

	if(firstReconnect)
	{
		firstReconnect = false;
		SocketConnect();
		return;
	}

	wait = Math.min(wait * 2, 16);
	timeout = setTimeout(SocketConnect, wait * 1000);

	SetStatus("");
	SetReconnect(wait, "Die Verbindung wurde beendet.<br>Grund: " + event.code + ": " + event.reason)
}

function Send()
{
	if(webSocket.readyState != 1)
	{
		SetStatus("Dein Post kann aktuell nicht gesendet werden...");
		return;
	}

	msg = JSON.stringify({
	    channel: options["channel"],
	    name: sendPart.getElementById ("name").value,
	    message: sendPart.getElementById ("message").value,
	    delay: position,
	    publicid: options["publicid"]});
	webSocket.send(msg);
	messageCache.push(msg);
	if(webSocket.bufferedAmount != 0)
		SetStatus("Es werden noch " + messageCache.length.toFixed() + " Posts gesendet");
	sendPart.getElementById("message").value = "";
	sendPart.getElementById("message").focus();
}

function Ping()
{
	if(webSocket.readyState != 1)
		return;

	if(pendingPongs >= 2)
	{
		SocketConnect();
		return;
	}

	msg = JSON.stringify({type: "ping"});
	webSocket.send(msg);
	pendingPongs++;
}

// Wird für jede ankommende Nachricht aufgerufen
function ProcessPost(post)
{
	post['id'] = parseInt(post['id']);
	if(post['id'] < position)
		return;

	if(messageCache.length != 0 && 
		post["name"] === messageCache.splice(-1)[0]["name"] && post["message"] === messageCache.splice(-1)[0]["message"])
	{
		messageCache.pop()
		if(messageCache.length != 0)
			SetStatus("Es werden noch " + messageCache.length + " Posts gesendet");
	}
	else
	{
		SetStatus("");
	}

	position = post['id'] + 1;
	posts.push(post);

	if (!options["old"])
	{
		var container = recvPart.getElementById("posts");
		for (var node = container.lastChild, i = 1; node != null; ++i)
		{
			var temp = node;
			node = node.previousSibling;
			if (i >= options["last"])
				container.removeChild(temp);
		}
	}

	AppendPost(recvPart.getElementById('posts'), post);
	ProcessMath();
	UpdateTitle(post['message']);
	if (window.Notification && Notification.permission === "granted" && !isActive && options['notifications']) {
		if (notification) {notification.close();}
		try{
			notification = new Notification(post["name"].trim().substr(0, 30), {body : post["message"].substr(0, 200), icon : "favicon.ico"});
			setTimeout(function(){
					notification.close();
				}, 3000); 
		} catch (e) {
		}
	}
	if (!isActive){
		unreadCount += 1;
		changeFavicon();
	}
	ScrollDown();
}

// Erstellt einen HTML-Knoten für diese Nachricht
function AppendPost(container, post)
{
	if(options['botblock'] && post['bottag'] == '1')
		return;

	if(options['layout'] == 'mobile')
		container.appendChild(FormatMobilePost(post));
	else
		container.appendChild(FormatScreenPost(post));
}


// Stellt eine Nachricht als HTML dar (Version für große Bildschrime)
function FormatScreenPost(post)
{
	var tr = recvPart.createElement('tr');
	tr.setAttribute('id', 'post' + post['id']);
	tr.setAttribute('class', 'post');
	tr.setAttribute('style', 'color:#' + PostColor(post));

	var delay = recvPart.createElement('span');
	delay.setAttribute('class', 'delay');
	delay.appendChild(recvPart.createTextNode(DelayString(post)));

	var date = recvPart.createElement('span');
	date.setAttribute('class', 'date');
	date.appendChild(recvPart.createTextNode(post['date'].substr(5)));

	var info = recvPart.createElement('td');
	info.setAttribute('class', 'info');
	if(options['delay']) info.appendChild(delay);
	info.appendChild(date);
	tr.appendChild(info);

	var userid = recvPart.createElement('td');
	userid.setAttribute('class', 'userid');
	userid.appendChild(recvPart.createTextNode(IDString(post)));
	userid.title=IDTitle(post);
	if(options['showids']) tr.appendChild(userid);

	var name = recvPart.createElement('td');
	name.innerHTML = HtmlEscape(post["name"] + ":");
	name.setAttribute('class', 'name');
	tr.appendChild(name);

	var message = recvPart.createElement('td');
	message.innerHTML = HtmlEscape(post["message"]);
	if(options["links"]) message.innerHTML = InsertLinks(message.innerHTML);
	message.setAttribute('class', 'message');
	tr.appendChild(message);

	return tr;
}

// Stellt eine Nachricht als HTML dar (Version für kleine Bildschrime)
function FormatMobilePost(post)
{
	var li = recvPart.createElement('li');
	li.setAttribute('id', 'post' + post['id']);
	li.setAttribute('class', 'post');
	li.setAttribute('style', 'color:#' + PostColor(post));

	var name = recvPart.createElement('span');
	name.innerHTML = HtmlEscape(post["name"] + ":");
	name.setAttribute('class', 'name');
	li.appendChild(name);

	var date = recvPart.createElement('span');
	date.setAttribute('class', 'date');
	date.appendChild(recvPart.createTextNode(post['date']));
	
	var userid = recvPart.createElement('span');
	userid.setAttribute('class', 'userid');
	var useridstr = IDString(post)
	userid.appendChild(recvPart.createTextNode(useridstr ? "[" + IDString(post) + "]" : ""));
	userid.title=IDTitle(post);

	var delay = recvPart.createElement('span');
	delay.setAttribute('class', 'delay');
	delay.appendChild(recvPart.createTextNode(DelayString(post)));

	var info = recvPart.createElement('span');
	info.setAttribute('class', 'info');
	info.appendChild(date);
	if(options['showids'])
		info.appendChild(userid);
	if(options['delay'])
		info.appendChild(delay);
	li.appendChild(info);

	var message = recvPart.createElement('span');
	message.innerHTML = HtmlEscape(post["message"]);
	if(options["links"]) message.innerHTML = InsertLinks(message.innerHTML);
	message.setAttribute('class', 'message');
	li.appendChild(message);
	
	if (!inHistoryMode){
		var timer = null;
		li.switchState =  function(){
			if (li.style.backgroundColor == 'blue') {
				li.style.backgroundColor = '';
				for (var i = 0; i < li.children.length; i+=1){
					li.children[i].style.color = '';
				}
				selectcount -= 1;
				if (selectcount == 0){
					document.getElementById("quote").style.display = "none";
				}
			} else {
				li.style.backgroundColor = 'blue';
				for (var i = 0; i < li.children.length; i+=1){
					li.children[i].style.color = 'white';
				}
				selectcount += 1;
				if (selectcount == 1){
					document.getElementById("quote").style.display = "inline-block";
				}
			}
		};
		
		li.ontouchstart = function(){
			timer = setTimeout(li.switchState, selectcount ? 0 : 1000  );
		};
		
		li.ontouchend = function(){
		  clearTimeout( timer );
		};
	
		li.ontouchmove = function(){
		  clearTimeout( timer );
		};
	}

	return li;
}

function IDTitle(post)
{
	var username=post['username']==null ? "" : post['username'];
	var userid=post['user_id']==null ? "" : post['user_id'];
	return username + (userid ? " ("+userid+")" : "");
}
function IDString(post)
{
	var username=post['username']==null ? (post['user_id']==null ? "" : "?") : post['username'];
	var userid=post['user_id']==null ? "" : post['user_id'];
	if (username.length>18) username=username.substring(0,15)+"...";
	switch (options['showids']){
	case 1:
		return userid;
	case 2:
		return username;
	case 3:
		return username + (userid ? " ("+userid+")" : "");
	case 4:
		return userid ? "✓" : "";
	default:
		return "";
	} 
}
function DelayString(post)
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
	return delay;
}

// Generiert die anzeigten Posts neu (z.B. falls Einstellungen geändert werden)
function RecreatePosts()
{
	var container;
	if(options['layout'] == 'mobile') container = recvPart.createElement('ul');
	else container = recvPart.createElement('table');
	container.id = 'posts';

	var from = (options["old"] || inHistoryMode) ? 0 : Math.max(0, posts.length - options["last"]);
	for (var cursor = from; cursor != posts.length; ++cursor)
		AppendPost(container, posts[cursor]);
	var node = recvPart.getElementById('posts');
	node.parentNode.replaceChild(container, node);

	if(posts.length != 0 && !inHistoryMode) UpdateTitle(posts[posts.length - 1]['message']);

	ProcessMath();
	ScrollDown();
}


// *********************
// *   Einstellungen   *
// *********************

function InitSettings()
{
	confPart.getElementById("publicid").checked = options["publicid"];
	confPart.getElementById("delay").checked = options["delay"];
	confPart.getElementById("links").checked = options["links"];
	confPart.getElementById("old").checked = options["old"];
	confPart.getElementById("last").value = count = options["last"];
	confPart.getElementById("botblock").checked = options["botblock"];
	confPart.getElementById("math").checked = options["math"];
	confPart.getElementById("notifications").checked = options["notifications"];
	confPart.getElementById("favicon").checked = options["favicon"];
	confPart.getElementById("showids").value = options["showids"];

	var skinSelect = confPart.getElementById('skin');
	skinSelect.add(new Option("Dunkelgrauton", 'dunkelgrauton'));
	skinSelect.add(new Option("Nachtschwarz", 'schwarzwiedienacht'));
	skinSelect.add(new Option("My Little Pony", 'mylittlepony'));
	skinSelect.add(new Option("Apfelweiß", 'apfelweiss'));
	skinSelect.value = options['skin'];

	var layoutSelect = confPart.getElementById('layout');
	layoutSelect.add(new Option("für Bildschirme", 'screen'));
	layoutSelect.add(new Option("mobile Version", 'mobile'));
	layoutSelect.value = options['layout'];

	ApplySettings();
}

function UpdateSettings()
{
	options["publicid"] = confPart.getElementById("publicid").checked ? 1 : 0;
	options["delay"] = confPart.getElementById("delay").checked ? 1 : 0;
	options["links"] = confPart.getElementById("links").checked ? 1 : 0;
	options["old"] = confPart.getElementById("old").checked ? 1 : 0;
	options["botblock"] = confPart.getElementById("botblock").checked ? 1 : 0;
	options["notifications"] = confPart.getElementById("notifications").checked ? 1 : 0;
	options["skin"] = confPart.getElementById("skin").value;
	options["layout"] = confPart.getElementById("layout").value;
	options["math"] = confPart.getElementById("math").checked ? 1 : 0;
	options["name"] = sendPart.getElementById("name").value;
	options["favicon"] = confPart.getElementById("favicon").checked ? 1 : 0;

	options["showids"] = parseInt(confPart.getElementById("showids").value);

	var input = confPart.getElementById("last");
	var num = parseInt(input.value);
	if(isNaN(num)) num = options["last"];
	input.value = options["last"] = Math.min(Math.max(num, 1), 1000);
	ApplySettings();
	InitNotifications();
}


function Decrease()
{
	var input = confPart.getElementById("last");
	input.value = options['last'] = Math.max(1, parseInt(input.value) - 1);
	ApplySettings();
}

function Increase()
{
	var input = confPart.getElementById("last");
	input.value = options['last'] = Math.min(1000, parseInt(input.value) + 1);
	ApplySettings();
}

function ApplySettings()
{
	if(!inHistoryMode) {
		URIReplaceState();
		RecreatePosts();
		sendPart.getElementById('name').placeholder = options['layout'] == 'mobile' ? 'Name' : '';
		sendPart.getElementById('message').placeholder = options['layout'] == 'mobile' ? 'Nachricht' : '';	
	}
	if(options['math'] == 1) LoadMathjax();

	document.getElementsByTagName('body')[0].className = options['layout'] + " " + options['skin'];
	document.getElementById('layoutcsslink').href = options['layout'] == 'mobile' ? 'mobile.css' : 'screen.css';
	document.getElementById('theme-color').content=themecolors[options['skin']];
}

function LayoutSelected(layoutSelect)
{	
	document.getElementById('settingbox').style.display = (layoutSelect.value == 'screen') ? 'block' : 'none';
	document.getElementById('logbox').style.display = (layoutSelect.value == 'screen') ? 'block' : 'none';
	UpdateSettings();
	ScrollDown();
}

function URIReplaceState()
{
	if(history.replaceState) history.replaceState(null, '', '?' + OptionURL());
}


// ************
// *   Logs   *
// ************

var inHistoryMode;

// Für das Herunterladen und Anzeigen des Chatlogs
function LoadHistory()
{
	window.onerror = ErrorHandler;
	inHistoryMode = true;
	posts = Array();

	LoadOptions();
	ApplySettings();

	SetStatus("Lade alte Posts...");

	parameters = URIDecodeParameters();
	parameters['version'] = version;

	recvRequest = new XMLHttpRequest();
	recvRequest.onreadystatechange = OnHistoryResponse;
	recvRequest.open('GET', '/rubychat/history?' + URIEncodeParameters(parameters), true);
	recvRequest.send();
	UpdateTitle("Log des QED-Chats");
}

// Wird aufgerufen, falls der Server eine Antwort geschickt hat.
function OnHistoryResponse()
{
	if(recvRequest.readyState != 4) return;
	if(recvRequest.status < 200 || recvRequest.status >= 300) return;

	var lines = recvRequest.responseText.split("\n");
	for(var index in lines)
	{
		if(lines[index] == "") continue;

		obj = JSON.parse(lines[index]);
		if(obj["type"] == "post")
			posts.push(obj);
		else if(obj["type"] == "error")
			throw new Error(obj["description"], obj["file"], obj["line"]);
	}

	RecreatePosts();
	SetStatus("Alter Chatlog wurde erfolgreich geladen!");
}


// Wird aufgerufen, wenn der Benutzer auf einen Link zum Chatlog klickt
function OnHistoryClicked(elt)
{
	url = "history.html?";
	if(elt.id == 'lastHour')
		url += URIEncodeParameters({mode: 'daterecent', last: '3600'});
	else if(elt.id == 'lastDay')
		url += URIEncodeParameters({mode: 'daterecent', last: '86400'});
	else if(elt.id == 'lastWeek')
		url += URIEncodeParameters({mode: 'daterecent', last: '604800'});
	else if(elt.id == 'last300')
		url += URIEncodeParameters({mode: 'postrecent', last: '300'});
	else if(elt.id == 'last1000')
		url += URIEncodeParameters({mode: 'postrecent', last: '1000'});
	else if(elt.id == 'fromOwnPost')
		url += URIEncodeParameters({mode: 'fromownpost'});
	else if(elt.id == 'interval')
		url += URIEncodeParameters({mode: 'dateinterval',
			from : logsPart.getElementById("logFrom").value,
			to : logsPart.getElementById("logTo").value});
	else if(elt.id == 'sincepost')
		url += URIEncodeParameters({mode: 'lastownpost'});

	var tempOptions = new Object();
	for(var i in options)
		if(options[i] != defaults[i]) tempOptions[i] = options[i];
	delete tempOptions['last'];
	url += '&' + URIEncodeParameters(tempOptions);

	window.open(url, '_blank');
}


// *****************
// *   Sonstiges   *
// *****************


function Quote()
{
	var postsh = document.getElementById("posts");
	var q = "";
	for (var i = 1; i <= postsh.children.length; i++){
		var child = postsh.children[postsh.children.length-i];
		if (child.style.backgroundColor == 'blue'){
			child.ontouchstart();
			child.ontouchend();
		/*	child.style.backgroundColor = '';
			for (var j = 0; j < li.children.length; j++){
				child.children[j].style.color = '';
				}*/
		    q = posts[posts.length-i]['date'] +" " + posts[posts.length-i]['name'].trim() + ": " + posts[posts.length-i]['message']+"\n" + q;
			//q+=posts[i]['date'] +" " +(options['ip'] ?  posts[i]['ip'] : "") + posts[i]['name'].trim() + ": " + posts[i]['message']+"\n";

//q += child.children[1].children[0].innerHTML + " " + (options['ip'] ?  child.children[1].children[1].innerHTML : "") +  child.children[0].innerHTML + " " +  child.children[2].innerHTML + "\n";
		}
			
	}
	document.getElementById("message").value = q;
	document.getElementById("quote").style.display = "none";
	selectcount = 0;
	RecreatePosts();
}


function ShowMenu(menu)
{
	document.getElementById('settingbox').style.display = (menu == 'settings') ? 'block' : 'none';
	document.getElementById('logbox').style.display = (menu == 'logs') ? 'block' : 'none';
}


function InitNotifications()
{	
	if (window.Notification && Notification.permission !== "granted" && options['notifications']) {
		Notification.requestPermission(function (status) {
			if (Notification.permission !== status) {
				Notification.permission = status;
			}
		});
	}
	window.onfocus = function () { 
		isActive = true; 
		unreadCount = 0;
		changeFavicon();
	}; 

	window.onblur = function () { 
		isActive = false; 
	}; 
}

var reconnectTimer, reconnectSeconds, reconnectText;
function SetReconnect(seconds, text)
{
	clearInterval(reconnectTimer);
	reconnectSeconds = seconds;
	reconnectText = text;
	reconnectTimer = setInterval(UpdateReconnect, 1000);
}

function UpdateReconnect()
{
	if(reconnectSeconds <= 0)
	{
		clearInterval(reconnectTimer);
		recvPart.getElementById("reconnect").innerHTML = "";
		return;
	}

	reconnectSeconds--;

	var text = "";
	if(reconnectText != "")
		text = reconnectText + "</br>";
	text += "Neue Verbindung wird in " + reconnectSeconds + " s erstellt."

	recvPart.getElementById("reconnect").innerHTML = text;
}

function SetStatus(text)
{
    recvPart.getElementById("status").innerHTML = text;
    ScrollDown();
}

function URIEncodeParameters(params)
{
	var result = [];
	for(var key in params)
		result.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
	return result.join("&");
}

/* Originally from http://papermashup.com/read-url-get-variables-withjavascript/, but adapted. */
function URIDecodeParameters() {
	var vars = {}, k, v;
	location.search.replace(/[?&]+([^=&]+)=([^&#]*)/gi, function(m,key,value) {
		k = decodeURIComponent(key.replace(/\+/g, '%20'));
		v = decodeURIComponent(value.replace(/\+/g, '%20'));
		vars[k] = v;
	});
	return vars;
}

// from http://stackoverflow.com/questions/260857/changing-website-favicon-dynamically
function changeFavicon() {
	unreadCount = ((unreadCount > 10) ? 10 : unreadCount) * options["favicon"];
	src = "/" + unreadCount + ".ico";
	if (unreadCount == 0) {
		src  = "/favicon.ico";
	}
	var link = document.createElement('link'), oldLink = document.getElementById('dynamic-favicon');
	link.id = 'dynamic-favicon';
	link.rel = 'shortcut icon';
	link.href = src;
	if (oldLink) {
		document.head.removeChild(oldLink);
	}
	document.head.appendChild(link);
}

function InvertColor(color)
{
	var s = (parseInt(color,16) ^ 0xFFFFFF).toString(16);
	return Array(6-s.length+1).join("0") + s;
	//return "0".repeat(6-s.length)+s; <- geht erst ab ECMA-Script6
}

function PostColor(post)
{
	return (options['skin'] != 'mylittlepony' && options['skin'] != 'apfelweiss') ?
		post['color'] : InvertColor(post['color']);
}

function ScrollDown()
{
	var node = recvPart.getElementById("posts").parentNode;
	if(node) node.scrollTop = node.scrollHeight;
}

function HtmlEscape (text)
{
	if(!text) return '';
	text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	return text.replace(/\"/g, "&quot;").replace(/\n/g, "<br>");
}

function InsertLinks (text)
{
	return text.replace (/(https:\/\/|http:\/\/|ftp:\/\/)([\wäüößÄÜÖ\&.~%\/?#=@:\[\]+\$\,-;!]*)/g,
		'<a rel="noreferrer" target="_blank" href="$1$2">$1$2</a>');
}

function UpdateTitle(message)
{
	if(options["title"])
		top.document.title = (message.length < 256) ? message :
			top.document.title = message.substr(0, 252) + "...";
}

function ReadCookie(key)
{
    var result;
    return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? (result[1]) : null;
}


// mathjaxProgress: 0 = Mathjax deaktiviert, 1 = Mathjax ladend, 2 = Mathjax fertig geladen
var mathjaxProgress = 0;

// Lädt Mathjax - Erstmal nur zum Testen
function LoadMathjax()
{
	if(mathjaxProgress > 0) return;

	var authorInit = "function() { MathJax.Hub.Register.StartupHook(" +
		"'End', function() {parent.mathjaxProgress = 2; RecreatePosts();})}"
	var config = recvPart.createElement("script");
	config.type = "text/javascript";
	config[(window.opera ? "innerHTML" : "text")] =
		"window.MathJax = {" +
		" AuthorInit: " + authorInit + "," +
		" displayAlign: 'left'," +
		//" 'HTML-CSS': {linebreaks: {automatic: true}}" +
		"};";
	recvPart.getElementsByTagName("head")[0].appendChild(config);

	var script = recvPart.createElement("script");
	script.type = "text/javascript";
	script.src  = "/mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML,Safe&locale=de&noContrib";
	recvPart.getElementsByTagName("head")[0].appendChild(script);
	mathjaxProgress = 1;
}

// Lässt MathJax nochmal rüberlaufen
function ProcessMath()
{
	if(options['math'] == 1 && mathjaxProgress == 2)
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
}

function ErrorHandler(description, filename, line)
{
	message = "Ein Fehler trat auf:<br>";
	message += HtmlEscape(description) + "<br>";
	message += "In Datei " + filename + ", Zeile " + line + ".<br>";
	//message += "Bitte Seite neu laden. (Unter Firefox Strg+Shift+R).";
	SetStatus(message);
	ScrollDown();
	SocketDisconnect();
	return false;
}

// *************
// *   Login   *
// *************

function LoginInit()
{
	LoadOptions();
}

function OnLoginClicked(mode)
{
	loginRequest = new XMLHttpRequest();
	loginRequest.onreadystatechange = function() {OnLoginResponse(mode)};
	loginRequest.open("POST", "/rubychat/account", true);
	loginRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	loginRequest.setRequestHeader("Content-Encoding", "utf-8");

	if(mode == 'logout') url = URIEncodeParameters({logout: 1});
	else url = URIEncodeParameters({
			username: document.getElementById('login_username').value,
			password: document.getElementById('login_password').value,
			version: version});

	loginRequest.send(url);
}


function OnLoginResponse(mode)
{
	if(loginRequest.readyState != 4) return;
	obj = JSON.parse(loginRequest.responseText);

	if(mode == 'logout' && obj['result'] == 'success')
		document.location.href = "account.html?" + OptionURL();
	else if(mode == 'login' && obj['result'] == 'success')
		document.location.href = "index.html?" + OptionURL();
	else if(mode == 'login' && obj['result'] == 'fail')
		document.getElementById('message').innerText = obj['message'];

}

