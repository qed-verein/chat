var options = new Object();
var version = "20161022000000"; // muss in data ebenfalls geaendert werden

var recvPart, sendPart, confPart, logsPart;
var notification, isActive = true, unreadCount = 0, selectcount = 0;

var defaults = {
		channel: "", name: "",
		last: 24, botblock: 0, old: 0, ip: 0, delay: 0, links: 1, title: 1, math: 0, 
		notifications: 1, favicon: 1,
		layout: 'screen', skin: 'dunkelgrauton',
		limit: 256,	wait: 60,
		redirect: "http://uxul.de/redirect.php?"
	};


function LoadOptions()
{
	integerOptions = ['last', 'limit', 'wait'];
	booleanOptions = ['botblock', 'old', 'ip', 'delay', 'links', 'title', 'math', 'notifications', 'favicon'];
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
	window.onunload = ReceiverDisconnect;
	
	InitReceiver();
	InitSender();
	InitSettings();
	InitNotifications();
}

// *****************
// *   Empfänger   *
// *****************


var firstReconnect, recvRequest, position, textpos, posts, timeout;

function InitReceiver()
{
	recvRequest = new XMLHttpRequest();
	posts = Array();
	RecreatePosts();
	position = -24;
	ReceiverConnect();
}


// Erstelle eine neue Verbindung mit dem Server
function ReceiverConnect()
{
	ReceiverDisconnect();
	SetStatus("Verbindung unterbrochen. Erstelle neue Verbindung mit dem Server ...");

	textpos = 0;
	firstReconnect = false;
	timeout = setTimeout("ReceiverConnect()", options['wait'] * 1000);

	uri = "/rubychat/view?" + URIEncodeParameters({
	    channel: options["channel"], position: position, limit: options["limit"],
	    version: version, keepalive: Math.ceil(options["wait"] / 2)});
	// Workaround für https://bugzilla.mozilla.org/show_bug.cgi?id=408901
	uri += "&random=" + (Math.random() * 1000000);
	recvRequest.onreadystatechange = OnReceiverResponse;
	recvRequest.open('GET', uri, true);
	recvRequest.send();
}

// Schließe die Verbindung
function ReceiverDisconnect()
{
	clearTimeout(timeout);
	recvRequest.onreadystatechange = null;
	recvRequest.abort();
}

// Wird aufgerufen, falls der Server eine Antwort geschickt hat.
function OnReceiverResponse()
{
	if(recvRequest.readyState < 3)
		return;

	if(recvRequest.status < 200 || recvRequest.status >= 300)
		return;

    var end, obj;
    while((end = recvRequest.responseText.indexOf("\n", textpos)) >= 0)
    {
		obj = JSON.parse(recvRequest.responseText.substring(textpos, end));

		if(obj["type"] == "post")
			ProcessPost(obj);
		else if(obj["type"] == "error")
			throw new Error(obj["description"], obj["file"], obj["line"]);
		else if(obj["type"] != "ok" && obj["type"] != "debug")
			throw new Error("Unbekannter Typ");

		 if(obj["type"] == "ok" && obj["started"] == "1")
			SetStatus("");
		 if(obj["type"] == "ok" && obj["finished"] == "1")
			firstReconnect = true;
		textpos = end + 1;

		// Timeout zurücksetzen
		clearTimeout(timeout);
		timeout = setTimeout("ReceiverConnect()", options['wait'] * 1000);
	}

	// Beim ersten Versuch ohne Wartezeiten neu verbinden.
	if(recvRequest.readyState == 4 && firstReconnect)
		ReceiverConnect();
}

// Wird für jede ankommende Nachricht aufgerufen
function ProcessPost(post)
{
	post['id'] = parseInt(post['id']);
	if(post['id'] < position)
		return;

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

	var ip = recvPart.createElement('td');
	ip.setAttribute('class', 'ip');
	ip.appendChild(recvPart.createTextNode(post['ip']));
	if(options['ip']) tr.appendChild(ip);

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

	var ip = recvPart.createElement('span');
	ip.setAttribute('class', 'ip');
	ip.appendChild(recvPart.createTextNode("[" + post['ip'] + "]"));

	var delay = recvPart.createElement('span');
	delay.setAttribute('class', 'delay');
	delay.appendChild(recvPart.createTextNode(DelayString(post)));

	var info = recvPart.createElement('span');
	info.setAttribute('class', 'info');
	info.appendChild(date);
	if(options['ip'])
		info.appendChild(ip);
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
	confPart.getElementById("ip").checked = options["ip"];
	confPart.getElementById("delay").checked = options["delay"];
	confPart.getElementById("links").checked = options["links"];
	confPart.getElementById("old").checked = options["old"];
	confPart.getElementById("last").value = count = options["last"];
	confPart.getElementById("botblock").checked = options["botblock"];
	confPart.getElementById("math").checked = options["math"];
	confPart.getElementById("notifications").checked = options["notifications"];
	confPart.getElementById("favicon").checked = options["favicon"];

	var skinSelect = confPart.getElementById('skin');
	skinSelect.add(new Option("Dunkelgrauton", 'dunkelgrauton'));
	skinSelect.add(new Option("Nachtschwarz", 'schwarzwiedienacht'));
	skinSelect.add(new Option("My Little Pony", 'mylittlepony'));
	skinSelect.value = options['skin'];

	var layoutSelect = confPart.getElementById('layout');
	layoutSelect.add(new Option("für Bildschirme", 'screen'));
	layoutSelect.add(new Option("mobile Version", 'mobile'));
	layoutSelect.value = options['layout'];

	ApplySettings();
}

function UpdateSettings()
{
	options["ip"] = confPart.getElementById("ip").checked ? 1 : 0;
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
	document.getElementById('theme-color').content=window.getComputedStyle(document.body).getPropertyValue('background-color');
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


// **************
// *   Sender   *
// **************

var sendRequest, sendTimeout;

function InitSender()
{
	sendPart.getElementById("name").value = options["name"];
	sendPart.getElementById("message").focus();
	sendRequest = null;
}

// Schickt eine Nachricht zum Server
function Send()
{
	if(sendRequest != null)
	{
		SetStatus("Dein alter Post wird noch gesendet ...");
		return;
	}

	SetStatus("Sende Post ...");
	ScrollDown();
	sendRequest = new XMLHttpRequest();
	sendRequest.onreadystatechange = OnSenderResponse;
	sendRequest.open("POST", "/rubychat/post", true);
	sendRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	sendRequest.setRequestHeader("Content-Encoding", "utf-8");

	sendTimeout = setTimeout("OnSenderError()", options["wait"] * 1000);

	uri = URIEncodeParameters({
	    channel: options["channel"],
	    name: sendPart.getElementById ("name").value,
	    message: sendPart.getElementById ("message").value,
	    delay: position,
	    version: version});
	sendRequest.send(uri);
}

// Bestätigung der gesendeten Nachricht
function OnSenderResponse()
{
	if(sendRequest.readyState != 4)
		return;

	if(sendRequest.status >= 200 && sendRequest.status < 300)
	{
		SetStatus("");
		sendPart.getElementById("message").value = "";
		sendPart.getElementById("message").focus();
		clearTimeout(sendTimeout);
		sendRequest = null;
	}
	else OnSenderError();
}

// Falls beim Senden ein Fehler passiert ist
function OnSenderError()
{
	alert("Dein Post konnte nicht übertragen werden (" +
		sendRequest.status + ", '" + sendRequest.statusText + "').\n" +
			sendRequest.responseText);
	clearTimeout(sendTimeout);
	sendRequest = null;
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
	else if(elt.id == 'last100')
		url += URIEncodeParameters({mode: 'postrecent', last: '100'});
	else if(elt.id == 'last300')
		url += URIEncodeParameters({mode: 'postrecent', last: '300'});
	else if(elt.id == 'last1000')
		url += URIEncodeParameters({mode: 'postrecent', last: '1000'});
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
	for (var i = 0; i < postsh.children.length; i++){
		var child = postsh.children[i];
		if (child.style.backgroundColor == 'blue'){
			child.ontouchstart();
			child.ontouchend();
		/*	child.style.backgroundColor = '';
			for (var j = 0; j < li.children.length; j++){
				child.children[j].style.color = '';
			}*/
			q+=posts[i]['date'] +" " +(options['ip'] ?  posts[i]['ip'] : "") + posts[i]['name'].trim() + ": " + posts[i]['message']+"\n";

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
	return (options['skin'] != 'mylittlepony') ? post['color'] : InvertColor(post['color']);
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
	return text.replace (/(https:\/\/|http:\/\/|ftp:\/\/)([\w\&.~%\/?#=@:\[\]+\$\,-;!]*)/g,
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
	script.src  = "/MathJax-2.4-latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML&locale=de";
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
	ReceiverDisconnect();
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

