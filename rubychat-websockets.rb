require 'eventmachine'
require 'websocket'
require 'cgi'

$connectedClients = Array.new
$connectedClientsMutex = Mutex.new
class WsConnection < EM::Connection
	attr_reader :uid
	attr_reader :channel
	attr_reader :queue

	attr_accessor :position

	def initialize(queue)
		@queue = queue
	end

	def post_init
		@uid = nil #uid=nil means not authorized
		@handshake = nil
		@position = 0
		$connectedClientsMutex.synchronize { $connectedClients.push(self) } #Store connection
	end

	def receive_data(data)
		unless authorized?
			if @handshake.nil?
				handle_handshake data #Client must perform handshake before communicating
			else
				close 1002, "Du bist nicht eingeloggt!"
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

			validate_cookies

			#Create frame for incoming data. This frame will remain for the rest of the connection
			@frame = WebSocket::Frame::Incoming::Server.new(:version => @handshake.version)
			@state = :open

			#Set the channel
			query = CGI.parse @handshake.query unless @handshake.query.nil?
			if @handshake.query.nil? || !query.include?('channel')
				handle_fatal_error "Missing parameters"
				return
			end
			@channel = query['channel'][0]

			last = query.include?('last') ? [query['last'][0].to_i, 10000].min : 0

			@position = $chat.getCurrentId(@channel, last)
			$chat.getPostsByStartId(@channel, @position) { |row|
				send_post row.to_h
				@position = row.to_h[:id].to_i + 1
			}

			handle_incoming @handshake.leftovers if @handshake.leftovers
		else
			handle_fatal_error @handshake.error.to_s #This closes the connection
		end
	end

	#Sets the uid according to the cookie send on handshake
	def validate_cookies()
		return unless @handshake.headers.include?('cookie') #No match

		cookie = CGI::Cookie::parse @handshake.headers['cookie']
		return unless cookie.keys.include?('userid') && cookie.keys.include?('pwhash')
		return unless cookie['pwhash'][0].size == 40

		@uid = $chat.checkCookie cookie['userid'][0], cookie['pwhash'][0]
	end

	#Gets called when there is new data. Parses the data and selects what to do based on the type of the data
	def handle_incoming(data)
		@frame << data
		while frame = @frame.next #Repeate until current frame is fully processed
			if @state == :open
				case frame.type
					when :close #Client demands close -> We only need to confirm the close
						@state = :closing
						close
					when :ping
						send frame.to_s, :type => :pong
					when :text
						begin
							parsedJson = JSON.parse frame.to_s
						rescue JSON::ParserError => e
							puts e
							handle_fatal_error e
							return
						end
						if parsedJson.include?("type")
							send_log parsedJson
						else
							create_post parsedJson
						end
				end
			else
				break
			end
		end
		handle_fatal_error @frame.error if @frame.error?
	end

	def send_log(data)
		raise NotImplementedError
	end

	def send_post(posting)
		send $chat.formatAsJson(posting)
	end

	def create_post(data)
		name = data['name']
		message = data['message']
		date = Time.new.strftime "%Y-%m-%d %H-%M-%S"
		delay = data.has_key?('delay') ? data['delay'].to_i : nil
		bottag = data.has_key?('bottag') ? data['bottag'].to_i : 0
		publicid = data.has_key?('publicid') ? (data['publicid'].to_i == 0 ? 0 : 1) : 0

		#Send posts to db asynchroniously to avoid blockin
		operation = proc {
			$chat.createPost(name, message, @channel, date, @uid, delay, bottag, publicid)
		}

		#Only notify clients if the db-operation is successful
		callback = proc {
			$mutex.synchronize { $increment += 1; $condition.broadcast }
			@queue.push(@channel)
		}

		EM.defer(operation, callback)
	end

	#Gets called when the current connections encounters an error it cannot recover from
	def handle_fatal_error(error)
		error_code =
				case error
					when :invalid_payload_encoding then
						1007
					else
						1002
				end
		close error_code
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
		$connectedClientsMutex.synchronize { $connectedClients.delete self } #Cleanup client
	end
end
