require 'thread'
require 'socket'
require 'cgi'
require 'json'
require 'sequel'
require 'digest'
require 'eventmachine'
require './rubychat-config.rb'
require './rubychat-backend.rb'

class CGIAdapter < ::CGI
	attr_reader :args, :env_table, :stdinput, :stdoutput

	def initialize(enviroment, input, output, *args)
      @env_table = enviroment
      @stdinput = input
      @stdoutput = output
      @args = *args
      super(*args)
    end
end

def readSCGIHeaders(stream)
	len = stream.gets(":").chomp(":").to_i
	headers = Hash[*(stream.read(len).split("\0"))]
	stream.read(1)
	headers
end

class ChatError < StandardError; end

#Entry point for every request
#Points requests to the appropriate handler using the request-url
def handleRequest(cgi)
	#Login requests must be passed first. All other requests are auth only
	if cgi.script_name == "/rubychat/account"
		accountHandler cgi
		return
	end

	#These headers are sent with every response (except for login-responses)
	headers = {
		'Content-Type' => 'application/json; charset=utf-8', #All posts are sent as JSON
		'Cache-Control' => 'no-cache, must-revalidate', #Posts shouldn't be cached
		'Expires' => 'Sat, 26 Jul 1997 05:00:00 GMT'}
	cgi.print cgi.http_header(headers)

	begin
		cookieAuthenticate cgi #Authenticate via cookie and set the userid

		raise ChatError, "Du bist nicht in den Chat eingeloggt!" if Thread.current[:userid].nil? #No userid means auth-fail -> reject
		raise ChatError, "Ungueltige Versionsnummer!" if cgi.has_key? 'version' && cgi['version'] != '20170328000042'

		#Direct to appropriate handler
		case cgi.script_name
			when "/rubychat/post" #New post
				postHandler cgi
			when "/rubychat/view" #Get long-polling request
				viewHandler cgi
			when "/rubychat/history" #Get history (range of posts)
				historyHandler cgi
			else
				raise ChatError, "Unbekannter Befehl!"
		end
	rescue Errno::EPIPE => e
		raise e
	rescue StandardError => e
		writeToLog sprintf("\n%s: %s\n%s\n", e.class, e.message, e.backtrace.join("\n"))
		cgi.print({'type' => 'error', 'description' => e.message + "\n" + e.backtrace.join("\n")}.to_json)
	end
end

#This handler gets called when creating a new post
def postHandler(cgi)
	#Extract parameters form request
	name = cgi['name']
	message = cgi['message']
	channel = cgi['channel']
	date = Time.new.strftime "%Y-%m-%d %H-%M-%S"
	delay = cgi.has_key?('delay') ? cgi['delay'].to_i : nil
	bottag = cgi.has_key?('bottag') ? cgi['bottag'].to_i : 0
	publicid = cgi.has_key?('publicid') ? (cgi['publicid'].to_i == 0 ? 0 : 1) : 0

	$chat.createPost(name, message, channel, date, Thread.current[:userid], delay, bottag, publicid)

	#Notify all listeners about new post
	$mutex.synchronize{$increment += 1; $condition.broadcast}
	#queue.push $increment // TODO Auskommentiert, da nicht definiert 

	cgi.print({'type' => 'ok', 'finished' => 1}.to_json)
end

#Endpoint for long polling
#Handles requests to create new long polling connection
def viewHandler(cgi)
	#Parse request and set default values if missing
	position = cgi.has_key?('position') ? cgi['position'].to_i : -24
	limit = cgi.has_key?('limit') ? cgi['limit'].to_i : 1000

	#Get the -position last posts if position isn't positive
	if position <= 0 then
		position = $chat.getCurrentId(cgi['channel'], -position)
	end
	
	cgi.print ({'type' => 'ok', 'started' => 1}.to_json)  + "\n"
	cgi.stdoutput.flush
	
	#Enter message loop
	messageLoop(cgi) {		
		$chat.getPostsByStartId(cgi['channel'], position, limit) {|row|
			outputPosting(cgi, row.to_h)
			position = row[:id].to_i + 1
			limit -= 1 }
		cgi.stdoutput.flush
		break if limit <= 0
	}
	
	cgi.print ({'type' => 'ok', 'finished' => 1}.to_json)  + "\n"
	cgi.stdoutput.flush
end

def messageLoop(cgi)
	keepalive = cgi.has_key?('keepalive') ? cgi['keepalive'].to_i : 30
	keepalive = 1.0 / 0.0 if keepalive <= 0
	timeout = cgi.has_key?('timeout') ? cgi['timeout'].to_i : 3600
	timeout = Time.now + timeout
	threadIncrement = nil; sendKeepalive = false

	begin
		if sendKeepalive then
			cgi.print ({'type' => 'ok'}.to_json)  + "\n"
			cgi.stdoutput.flush
		else
			yield
		end
	
		$mutex.synchronize {
			$condition.wait($mutex, [[timeout - Time.now, keepalive].min, 0].max) if threadIncrement == $increment
			sendKeepalive = (threadIncrement == $increment)
			threadIncrement = $increment}
		raise ChatError, "Server wurde beendet" if !$running 
	end while Time.now < timeout
end

#Gets called when the histroy is request
def historyHandler(cgi)
	cgi.print ({'type' => 'ok', 'started' => 1}.to_json)  + "\n"
	channel = cgi['channel']
	
	case cgi['mode']
	when 'dateinterval'
		$chat.getPostsByDateInterval(channel, cgi['from'], cgi['to']) {|row| outputPosting(cgi, row)}
	when 'daterecent'
		from = Time.now - cgi['last'].to_i
		$chat.getPostsByStartDate(channel, from) {|row| outputPosting(cgi, row)}
	when 'postinterval'
		$chat.getPostsByIdInterval(channel, cgi['from'].to_i, cgi['to'].to_i) {|row| outputPosting(cgi, row)}
	when 'postrecent'
		$chat.getPostsByStartId(channel, $chat.getCurrentId(channel, cgi['last'].to_i)) {|row| outputPosting(cgi, row)}
	when 'fromownpost'
		$chat.getPostsByStartId(channel, $chat.getCurrentId(channel, Thread.current[:userid])) {|row| outputPosting(cgi, row)}
	else
		raise ChatError, "Unbekannter Modus!"
	end
	
	cgi.print ({'type' => 'ok', 'finished' => 1}.to_json)  + "\n"
end

def accountHandler(cgi)
	if cgi['logout'] == '1' then
		cookie1 = CGI::Cookie::new('name' => 'userid', 'value' => '',
			'path' => '/', 'expires' => Time.now - 3600 * 24)
		cookie2 = CGI::Cookie::new('name' => 'pwhash', 'value' => '',
			'path' => '/', 'expires' => Time.now - 3600 * 24)
		cgi.out('type' => 'application/json', 'cookie' => [cookie1, cookie2]) {
			{'result' => 'success', 'message' => 'Ausgeloggt'}.to_json}
		return
	end
	
	user = $chat.userAuthenticate(cgi['username'], cgi['password'])
	if user.nil? then
		cgi.out('type' => 'application/json') {
			{'result' => 'fail', 'message' => 'Logindaten sind ungültig'}.to_json}
	else
		cookie1 = CGI::Cookie::new('name' => 'userid', 'value' => user[:id].to_i.to_s,
			'path' => '/', 'expires' => Time.now + 3600 * 24 * 90)
		cookie2 = CGI::Cookie::new('name' => 'pwhash', 'value' => user[:password],
			'path' => '/', 'expires' => Time.now + 3600 * 24 * 90)
		cgi.out('type' => 'application/json', 'cookie' => [cookie1, cookie2]) {
			{'result' => 'success', 'message' => 'Eingeloggt'}.to_json}
	end
end

def outputPosting(cgi, posting)
	cgi.print $chat.formatAsJson(posting) + "\n"
end

def cookieAuthenticate(cgi)
	return if !cgi.cookies.keys.include?('userid') || !cgi.cookies.keys.include?('pwhash')
	return if cgi.cookies['pwhash'][0].nil? || cgi.cookies['pwhash'][0].size != 40
	Thread.current[:userid] = $chat.checkCookie(cgi.cookies['userid'][0], cgi.cookies['pwhash'][0])
end

$logMutex = Mutex.new

def writeToLog(message)
	$logMutex.synchronize {STDERR.puts message}
end

$mutex = Mutex.new
$condition = ConditionVariable.new
$increment = 0
$running = true
$chat = ChatBackend.new

threads = []
queue = EM::Queue.new

Signal.trap("USR2") do
	active = threads.select {|thread| !thread[:cgi].nil? && thread.alive?}
	STDERR.printf "Anzahl der Threads: %d\n", threads.size
	STDERR.printf "Anzahl der offenen Verbindungen: %d\n", active.size
	active.each {|thread|
		STDERR.printf "Verbunden: IP=%s RequestURI=%s UserAgent=%s\n", thread[:cgi].remote_addr,
			thread[:cgi].script_name.to_s + '?' + thread[:cgi].query_string.to_s, thread[:cgi].user_agent}
end

scgiServer = TCPServer.new "127.0.0.1", $scgiPort #Start tcp server for Scgi

writeToLog "Chatserver wurde gestartet."

#Not ready yet
=begin
#Start seperate thread to listen to WS-requests
wsServerThread = Thread.new do
	begin
		#Start EventMachine. This blocks this thread
		EventMachine.run {
			puts "Starting EM-Server"
			EventMachine.start_server "127.0.0.1", $wsPort, WsConnection, queue
			puts "Done"
		}
	end
end
=end

#Main loop: Listen for SCGI-requests and process them
begin
	loop do
		#Process new SCGI-request
		scgiConnection = scgiServer.accept
		scgiThread = Thread.new do #Each request gets its own thread
			begin	
				#Parse arguments and store them in the thread
				headers = readSCGIHeaders scgiConnection
				cgi = CGIAdapter.new headers, scgiConnection, scgiConnection
				Thread.current[:cgi] = cgi;

				#Begin request-handling
				handleRequest cgi
			rescue Errno::EPIPE, Errno::ECONNRESET => e
				writeToLog sprintf("Verbindung abgebrochen: %s", e.message);
			rescue Exception => e
				writeToLog sprintf("\n%s: %s\n%s\n", e.class, e.message, e.backtrace.join("\n"))
			ensure
				scgiConnection.close
			end
		end

		#Store thread
		threads.push scgiThread 
		threads.keep_if {|scgiThread| scgiThread.alive?}
	end
rescue Interrupt => e
	writeToLog "Beende den Chatserver."
	$running = false
	$mutex.synchronize {$condition.broadcast}
	threads.each {|t| t.join(1)}
ensure
	writeToLog "Chatserver wurde beendet."
end
