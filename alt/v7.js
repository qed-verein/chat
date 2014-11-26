/* Much of the Code is copied from receive.js and send.js */


var raw_options, // raw parsed URL parameters
	options, // preprocessed options
	posts = new Array(); // received posts


/* Originally from http://papermashup.com/read-url-get-variables-withjavascript/, but adapted. */
function getUrlVars() {
	var vars = {}, k, v, t;
	location.search.replace(/[?&]+([^=&]+)=([^&#]*)/gi, function(m,key,value) {
		k = decodeURIComponent(key);
		v = decodeURIComponent(value);
		vars[k] = v;
	});
	return vars;
}

function getOptions () {
	// do some preprocessing on the options
	raw_options = getUrlVars();
	options["anonym"] = (raw_options["anonym"] != undefined);
}

function ReceivePosts () {
}

}

function Init () {
	getOptions();
}

function ChatListener (errorCallback, receivePost) {
	/* This Class opens a connection to the Chat and calls the given Callbacks
	 * 
	 * errorCallback (number, description, fatal, restarts)
	 * receivePost (associativeArray)
	 *  */
	 var channels = new Array(),
		request, // the XMLHTTPRequest
		cursor, // Needed to split the String we got so far
		from = 0, // this is incremented whenever a post/pong comes
		timeWait, // this is the time in which "from" must change, otherwise the connection is considered disconnected
		position = -1, // the greatest received message-id
		numTries = 0; // how often have we been trying to reconnect?
	
	function Disconnected () {
		request.abort ();
		if (numTries == 10) {
			errorCallback(99, "Chat ist nicht erreichbar", true);
		} else {
			++numTries;
			openConnection();
		}
	}

	function StateChanged () {
		if (request.readyState >= 3) {
			var next, p;
			readloop:
			while ((next = request.responseText.indexOf (";", cursor) + 1) != 0) {
			try {
				p = $.parseJSON(request.responseText.substring (cursor, next - 1));
			} catch (e) {
				errorCallback (91923, "Invalid JSON: " + request.responseText.substring (cursor, next - 1), false);
				continue readloop;
			}
			++from; // doesn't matter what we actually received.
			numTries = 0; // dito
			
			if (p["type"] == "ok") {
				// these are just "pongs"
		    } else if (p["type"] == "error") {
				request.abort();
				errorCallback(19231, "The following Error occured: " + p, true);
		    } else if (p["type"] == "post") {
				if (p["id"] > position) {
					// We're checking this, so we do not call the callback function twice for the same post.
					receivePost(p);
				}
		    } else {
				errorCallback(91922, "Unknown Type", false);
		    }
		    cursor = next;
		}

		if (request.readyState == 4)
			Disconnected ();
	}

	this.openConnection = function () {
		request = new XMLHttpRequest ();
		cursor = 0;
		request.onreadystatechange = StateChanged;
		request.open ("GET", "view.php?type=json&channel=" + options["channel"] + "&position=" + position + "&limit=" + options["limit"], true);
		request.send ("");
		var to = from;
		setTimeout (function () { if (from == to) Disconnected (); }, timeWait);
	}
}
