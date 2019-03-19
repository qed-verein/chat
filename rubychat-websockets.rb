# coding: utf-8

# Copyright (C) 2004-2018 Quod Erat Demonstrandum e.V. <webmaster@qed-verein.de>
#
# This file is part of QED-Chat.
#
# QED-Chat is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# QED-Chat is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with QED-Chat.  If not, see
# <http://www.gnu.org/licenses/>.

require 'eventmachine'
require 'websocket'
require 'cgi'
require 'uri'
require './rubychat-common.rb'

$connectedClients = Array.new
$connectedClientsMutex = Mutex.new
class WsConnection < EM::Connection
	attr_reader :uid
	attr_reader :channel

	#queue is used to pass messages recieved on this connection to the main eventloop
	#There the message will get distributed to all connected clients
	attr_reader :queue

	attr_accessor :position
	attr_accessor :ping_failures
	
	attr_accessor :version

	def initialize(queue)
		@queue = queue
		@version = 1
	end

	def post_init
		@uid = nil #uid=nil means not authorized
		@handshake = nil
		@position = 0
		@limit = 10000
		@ping_failures = 0
		@state = :opening
		$connectedClientsMutex.synchronize { $connectedClients.push(self) } #Store connection
	end

	#This methode gets called by the TCP-Server everytime a connection recieves new data
	#Checks are performed to determine the state of the connection and the the data is redirected appropriately
	def receive_data(data)
		unless authorized?
			if @state == :opening
				handle_handshake data #Client must perform handshake before communicating
			else
				close 1002, "Du bist nicht eingeloggt!" #Only one attemped handshake per connection is allowed
			end
		else
			handle_incoming data
		end
	end

	def authorized?
		!@uid.nil?
	end

	#Handles handshake when connection is opened and uses cookies to auth the user
	def handle_handshake(data)
		#Create handshake
		@handshake = WebSocket::Handshake::Server.new
		@handshake << data

		#Check handshake
		return false unless @handshake.finished?
		if @handshake.valid?
			#Respond if necessary
			send @handshake.to_s, :type => :plain if @handshake.should_respond?

			query = CGI.parse @handshake.query unless @handshake.query.nil?
			if @handshake.query.nil? || !query.include?('version')
				@version = 1
			else
				@version = query['version'][0].to_i
			end

			handle_fatal_error :protocol_error, "Version unbekannt" if @version > 2

			#TODO: It might be possible (if client-server latency is very low) that the client recieves the handshake
			#before the connections is fully initiallized. This would cause the server to close the connection
			#without processing the data. Maybe think about queueing this data? Sending handshake-response later is not
			#an option because this would make it impossible to send errors to the client.

			#Check origin
			if @handshake.headers.include?('origin')
				uri = URI(@handshake.headers['origin'])
				if uri.host != $hostname
					writeToLog sprintf("Ungültiger Origin: %s", @handshake.headers['origin'])
					close 1002, "Ungültiger Origin."
					return
				end
			else
				close 1002, "Origin fehlt."
				return
			end

			validate_cookies

			#Create frame for incoming data. This frame will remain for the rest of the connection
			@frame = WebSocket::Frame::Incoming::Server.new(:version => @handshake.version)
			@state = :open

			unless authorized?
				close 4000, "Ungültige Anmeldedaten. Versuche am besten dich abzumelden."
				return
			end

			if banned?
				close 4001, "Du bist gebannt. Versuche es später nochmal."
				return
			end

			#Set the channel
			if @handshake.query.nil? || !query.include?('channel')
				close 1002, "Parameter 'channel' fehlt."
				return
			end
			@channel = query['channel'][0]

			begin
				#Set position, limit and send recent posts if requested
				@position = query.include?('position') ? query['position'][0].to_i : 0
				@limit = query.include?('limit') ? query['limit'][0].to_i : 0
				if @position <= 0
					@position = $chat.getCurrentId(@channel, -@position)
				end

				$chat.getPostsByStartId(@channel, @position, @limit) { |row|
					send_post row.to_h
					@position = row.to_h[:id].to_i + 1
				}
			rescue Sequel::DatabaseConnectionError => e
				writeException e
				handle_fatal_error e, "Fehler beim Kommunizieren mit der Datenbank."
				return
			end

			handle_incoming @handshake.leftovers if @handshake.leftovers
		else
			handle_fatal_error @handshake.error.to_s #This also closes the connection
		end
	end

	#Sets the uid according to the cookie send on handshake
	def validate_cookies()
		return unless @handshake.headers.include?('cookie') #No match

		cookie = CGI::Cookie::parse @handshake.headers['cookie']
		return unless cookie.keys.include?('userid') && cookie.keys.include?('pwhash')

		@uid = $chat.checkCookie cookie['userid'][0], cookie['pwhash'][0]
	end

	def banned?()
		return $chat.user?(@uid)
	end

	#Gets called when there is new data and the connection is already initiallized
	#Parses the data and selects what to do based on the type of the data
	def handle_incoming(data)
		@frame << data
		while frame = @frame.next #Repeat until current frame is fully processed
			if @state == :open
				case frame.type
					when :close #Client demands close -> We only need to confirm the close
						@state = :closing
						close
					when :ping
						send frame.to_s, :type => :pong
					when :pong
						@ping_failures = 0
					when :text
						begin
							parsedJson = JSON.parse frame.to_s
						rescue JSON::ParserError => e
							handle_fatal_error e
							return
						end

						if parsedJson.is_a? Fixnum
							writeToLog sprintf "Fehler: %s ist Fixnum!", frame.to_s
							handle_fatal_error :wtf, "wtf"
							return
						end

						unless parsedJson.has_key?('type') #Default to post if no type is set
							parsedJson['type'] = 'post'
						end

						case parsedJson['type']
							when 'ping'
								send '{"type": "pong"}', :type => :text
								next
							when 'post'
								create_post parsedJson
								next
							else
					 			handle_fatal_error :protocol_error, 'type ungültig: ' + parsedJson['type'] + '!'
								next
						end
					else #We don't know how to handle anything else -> Reject and abandon connection
						handle_fatal_error :unsupported_data_type
						return
				end
			else
				break
			end
		end
		handle_fatal_error @frame.error if @frame.error?
	end

	#Send the requested part of the log to the client
	#Not yet implemented
	def send_log(data)
		raise NotImplementedError
	end

	def send_post(posting)
		unless @state == :opening
			send $chat.formatAsJson(posting)
		end
	end

	def create_post(data)
		if banned?
			close 4001, "Du bist gebannt. Versuche es später nochmal."
			return
		end

		name = data['name']
		message = data['message']
		date = Time.new.strftime "%Y-%m-%d %H-%M-%S"
		delay = data.has_key?('delay') ? data['delay'].to_i : nil
		bottag = data.has_key?('bottag') ? data['bottag'].to_i : 0
		publicid = data.has_key?('publicid') ? (data['publicid'].to_i == 0 ? 0 : 1) : 0

		#TODO: Reenable async post-processing (Idea: Use some sort of queue to store posts and then process async)
		##Send posts to db asynchroniously to avoid blocking
		#operation = proc {
		begin
			$chat.createPost(name, message, @channel, date, @uid, delay, bottag, publicid)
		rescue Sequel::DatabaseConnectionError
			handle_fatal_error e, "Fehler beim Kommunizieren mit der Datenbank."
			return
		end

		if @version > 1
			send '{"type": "ack"}', :type => :text
		end
		$mutex.synchronize { $increment += 1; $condition.broadcast }
		@queue.push(@channel)

		#EM.defer(operation, callback)
	end

	def ping()
		if @ping_failures >= $wsFailsToTimeout
			close
			return
		end
		@ping_failures += 1
		send nil, :type => :ping
	end

	#Gets called when the current connections encounters an error it cannot recover from
	def handle_fatal_error(error, message = nil)
		error_code =
				case error
					when :invalid_payload_encoding then
						1007
					when :unsupported_data_type then
						1003
					else
						1002
				end
		close(error_code, message)
	end

	# Send data
	# @param data [String] Data to send
	# @param args [Hash] Arguments for send
	# @option args [String] :type Type of frame to send - available types are "text", "binary", "ping", "pong" and "close", default is "text"
	# @option args [Integer] :code Code for close frame
	# @return [Boolean] true if data was send
	def send(data, args = {})
		type = args[:type] || :text
		return if @state == :closed || (@state == :closing && type != :close)
		unless type == :plain #Plain is only used during handshake and is raw HTTP
			frame = WebSocket::Frame::Outgoing::Server.new :version => @handshake.version, :data => data, :type => type.to_s, :code => args[:code]
			if !frame.supported?
				return false
			elsif !frame.require_sending?
				return false
			end
			data = frame.to_s
		end
		send_data(data)
		true
	end

	#Closes the connection
	# @param code [Integer] Errorcode with which to close the connection. Default is 1000 = CLOSE_NORMAL
	def close(code = 1000, data = nil)
		if @state == :open
			@state = :closing
			send data, :type => :close, :code => code
		else
			send data, :type => :close if @state == :closing #This only happends when the client asked for closing the connection
			@state = :closed
		end
		close_connection_after_writing
	end

	#Gets called when connection is closed
	def unbind
		$connectedClientsMutex.synchronize { $connectedClients.delete self }
	end
end
