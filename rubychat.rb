require 'thread'
require 'socket'
require 'cgi'
require 'dbi'
require 'json'
require 'digest'
require './rubychat-config.rb'

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



def handleRequest(cgi)
	if cgi.script_name == "/rubychat/account"
		accountHandler cgi
		return
	end

	headers = {
		'Content-Type' => 'application/json; charset=utf-8',
		'Cache-Control' => 'no-cache, must-revalidate',
		'Expires' => 'Sat, 26 Jul 1997 05:00:00 GMT'}
	cgi.print cgi.http_header(headers)

	begin
		cookieAuthenticate cgi

		raise ChatError, "Du bist nicht in den Chat eingeloggt!" if Thread.current[:userid].nil?
		raise ChatError, "Ungueltige Versionsnummer!" if cgi.has_key? 'version' && cgi['version'] != '20161022000000'

		case cgi.script_name
			when "/rubychat/post"
				postHandler cgi
			when "/rubychat/view"
				viewHandler cgi
			when "/rubychat/history"
				historyHandler cgi
			else
				raise ChatError, "Unbekannter Befehl!"
		end
	rescue StandardError => e
		cgi.print({'type' => 'error', 'description' => e.message}.to_json)
	end
end


def postHandler(cgi)
	name = cgi['name']
	message = cgi['message']
	channel = cgi['channel']
	date = Time.new.strftime "%Y-%m-%d %H-%M-%S"
	delay = cgi.has_key?('delay') ? cgi['delay'].to_i : nil
	bottag = cgi.has_key?('bottag') ? cgi['bottag'].to_i : 0
	sql = "INSERT INTO content2 (name, message, channel, date, ip, user_id, delay, bottag) " +
		"VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
	chatDatabase {|db| db.do(sql, name, message, channel, date, cgi.remote_addr, Thread.current[:userid], delay, bottag)}

	$mutex.synchronize{$increment += 1; $condition.broadcast}

	cgi.print({'type' => 'ok', 'finished' => 1}.to_json)
end

def viewHandler(cgi)
	position = cgi.has_key?('position') ? cgi['position'].to_i : -24
	limit = cgi.has_key?('limit') ? cgi['limit'].to_i : 1000

	if position <= 0 then
		sqlNextId = "SELECT id + 1 AS next FROM content2 WHERE channel = ? ORDER BY id DESC LIMIT ?, 1"
		chatDatabase {|db| row = db.select_one(sqlNextId, cgi['channel'], -position)
			position = row.nil? ? 0 : row['next']}
	end
	
	cgi.print ({'type' => 'ok', 'started' => 1}.to_json)  + "\n"
	cgi.stdoutput.flush
	
	messageLoop(cgi) {chatDatabase {|db|			
		sql = "SELECT id, name, message, channel, DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date, ip, user_id, delay, bottag" +
			" FROM content2 WHERE id >= ? AND channel = ? ORDER BY id LIMIT ?"
		db.select_all(sql, position,  cgi['channel'], limit) {|row|
			outputPosting(cgi, row.to_h)
			position = row['id'].to_i + 1
			limit -= 1 }}
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
			$condition.wait($mutex, [[timeout - Time.now, keepalive].min, 0].max)
			sendKeepalive = (threadIncrement == $increment)
			threadIncrement = $increment}
		raise ChatError, "Server wurde beendet" if !$running 
	end while Time.now < timeout
end

def historyHandler(cgi)
	sqlTemplate = "SELECT id, name, message, channel, DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date, " +
		"ip, user_id, delay, bottag FROM content2 "

	cgi.print ({'type' => 'ok', 'started' => 1}.to_json)  + "\n"
	
	case cgi['mode']
	when 'dateinterval'
		sql = sqlTemplate + "WHERE channel = ? AND date >= ? AND date <= ? ORDER BY id"
		chatDatabase {|db|
			db.select_all(sql, cgi['channel'], cgi['from'], cgi['to']) {|row| outputPosting(cgi, row.to_h)}}
	when 'daterecent'
		from = Time.now - cgi['last'].to_i
		sql = sqlTemplate + "WHERE channel = ? AND date >= ? ORDER BY id"
		chatDatabase {|db|
			db.select_all(sql, cgi['channel'], from.strftime("%F %X")) {|row| outputPosting(cgi, row.to_h)}}
	when 'postinterval'
		sql = sqlTemplate + "WHERE channel = ? AND id >= ? AND id <= ? ORDER BY id"
		chatDatabase {|db|
			db.select_all(sql, cgi['channel'], cgi['from'].to_i, cgi['to'].to_i) {|row| outputPosting(cgi, row.to_h)}}
	when 'postrecent', 'fromownpost'
		chatDatabase {|db|
			if cgi['mode'] == 'postrecent' then
				sqlFromId = "SELECT id + 1 AS from_id FROM content2 WHERE channel = ? ORDER BY id DESC LIMIT ?, 1"
				row = db.select_one(sqlFromId, cgi['channel'], cgi['last'].to_i)
			elsif cgi['mode'] == 'fromownpost'
				sqlFromId = "SELECT MAX(id) AS from_id FROM content2 WHERE channel = ? AND user_id = ?"
				row = db.select_one(sqlFromId, cgi['channel'], Thread.current[:userid])
			end
			
			fromId = row.nil? ? 0 : row['from_id']
			sql = sqlTemplate + "WHERE channel = ? AND id >= ? ORDER BY id"
			db.select_all(sql, cgi['channel'], fromId) {|row| outputPosting(cgi, row.to_h)}
		}
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
	
	user = userAuthenticate(cgi['username'], cgi['password'])
	if user.nil? then
		cgi.out('type' => 'application/json') {
			{'result' => 'fail', 'message' => 'Logindaten sind ungültig'}.to_json}
	else
		cookie1 = CGI::Cookie::new('name' => 'userid', 'value' => user['id'].to_i.to_s,
			'path' => '/', 'expires' => Time.now + 3600 * 24 * 90)
		cookie2 = CGI::Cookie::new('name' => 'pwhash', 'value' => user['password'],
			'path' => '/', 'expires' => Time.now + 3600 * 24 * 90)
		cgi.out('type' => 'application/json', 'cookie' => [cookie1, cookie2]) {
			{'result' => 'success', 'message' => 'Eingeloggt'}.to_json}
	end
end

def chatDatabase
	DBI.connect($sqlDatabase, $sqlUsername, $sqlPassword) {|db|
		db.do("SET NAMES UTF8mb4"); yield(db)}
end


def outputPosting(cgi, posting)
	posting.each {|k, v| posting[k] = v.force_encoding('UTF-8') if v.class == String}
	posting.merge!({'type' => 'post', 'color' => colorForName(posting['name'])})
	cgi.print posting.to_json + "\n"
end

def colorForName(name)
	md5 = Digest::MD5.new
	r = md5.hexdigest('a' + name + 'a')[-7..-1].to_i(16) % 156 + 100
	g = md5.hexdigest('b' + name + 'b')[-7..-1].to_i(16) % 156 + 100
	b = md5.hexdigest('c' + name + 'c')[-7..-1].to_i(16) % 156 + 100
	r.to_s(16) + g.to_s(16) + b.to_s(16)
end

def cookieAuthenticate(cgi)
	return if !cgi.cookies.keys.include?('userid') || !cgi.cookies.keys.include?('pwhash')
	return if cgi.cookies['pwhash'][0].size != 40
	chatDatabase {|db|
		sql = "SELECT id FROM user WHERE id=? AND password=?"
		row = db.select_one(sql, cgi.cookies['userid'][0], cgi.cookies['pwhash'][0]);
		Thread.current[:userid] = row['id'].to_i if !row.nil?}
end


def userAuthenticate(username, password)
	sql = "SELECT id, password FROM user WHERE username=? AND password=SHA1(CONCAT(username, ?))"
	chatDatabase {|db| row = db.select_one(sql, username, password); return row.nil? ? nil : row.to_h}
end



$logMutex = Mutex.new

def writeToLog(message)
	$logMutex.synchronize {STDERR.puts message}
end

$mutex = Mutex.new
$condition = ConditionVariable.new
$increment = 0
$running = true

threads = []

Signal.trap("USR2") do
	active = threads.select {|thread| !thread[:cgi].nil? && thread.alive?}
	STDERR.printf "Anzahl der offenen Verbindungen: %d\n", active.size
	active.each {|thread|
		STDERR.printf "Verbunden: IP=%s RequestURI=%s UserAgent=%s\n", thread[:cgi].remote_addr,
			thread[:cgi].script_name.to_s + '?' + thread[:cgi].query_string.to_s, thread[:cgi].user_agent}
end

server = TCPServer.new "127.0.0.1", $scgiPort
writeToLog "Chatserver wurde gestartet."

begin
	loop do
		connection = server.accept
		thread = Thread.new do
			begin		
				headers = readSCGIHeaders connection
				cgi = CGIAdapter.new headers, connection, connection
				Thread.current[:cgi] = cgi;
				handleRequest cgi
			rescue Errno::EPIPE, Errno::ECONNRESET => e
				writeToLog sprintf("Verbindung abgebrochen: %s", e.message);
			rescue Exception => e
				writeToLog sprintf("\n%s: %s\n%s\n", e.class, e.message, e.backtrace.join("\n"))
			ensure
				connection.close
			end
		end
		threads.push thread
		threads.keep_if {|thread| thread.alive?}
	end
rescue Interrupt => e
	writeToLog "Beende den Chatserver."
	$running = false
	$mutex.synchronize {$condition.broadcast}
	threads.each {|t| t.join(1)}
ensure
	writeToLog "Chatserver wurde beendet."
end

