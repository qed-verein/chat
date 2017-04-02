#This class provides methodes to interface with the chat-db.
class ChatBackend
    #TODO: Think about locking
    #@@dbMutex = Mutex.new

    #Inserts a new post into db
    def createPost(name, message, channel, date, user_id, delay, bottag, public_id)
        sql = "INSERT INTO post (name, message, channel, date, user_id, delay, bottag, publicid) " +
		    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
	    chatDatabase {|db| db[sql, name, message, channel, date, user_id, delay, bottag, public_id].insert}
    end

    #Verifies the credentials
    # @return [Hash] Username and password if sucessful, nil if not
    def userAuthenticate(username, password)
	    sql = "SELECT id, password FROM user WHERE username=? AND password=SHA1(CONCAT(username, ?))"
	    chatDatabase {|db|
            row = db.fetch(sql, username, password).first
            return row.nil? ? nil : row.to_h
        }
    end

    #Verifies the cookie
    # @return [Integer] The uid if sucessful, nil if not
    def checkCookie(user_id, pwhash)
        sql = "SELECT id FROM user WHERE id=? AND password=?"
        chatDatabase {|db|
		    row = db.fetch(sql, user_id, pwhash).first
            return row.nil? ? nil : row[:id].to_i
        }
    end

    #Gets the id of current post - offset
    def getCurrentId(channel, offset)
        sql = "SELECT id + 1 AS from_id FROM post WHERE channel = ? ORDER BY id DESC LIMIT ?, 1"
		chatDatabase {|db| 
            row = db.fetch(sql, channel, offset).first
			return row.nil? ? 0 : row[:from_id]
        }
    end

    #Gets the id of the last post generated by a certain user
    def getLastPostId(channel, uid)
        sql = "SELECT MAX(id) AS from_id FROM post WHERE channel = ? AND user_id = ?"
        chatDatabase {|db|
            row = db.fetch(sql, channel, uid).first
            return row.nil? ? 0: row[:from_id]
        }
    end

    SqlPostTemplate = "SELECT post.id AS id, name, message, channel, DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date, user_id, delay, bottag, publicid, username " +
		"FROM post LEFT JOIN user ON post.user_id=user.id "
        
    #Gets all posts in a channel starting with id, orederd asc by id
    #Callback gets executed for each row
    def getPostsByStartId(channel, id, limit = 0, &callback)
        sql = SqlPostTemplate + "WHERE post.id >= ? AND channel = ? ORDER BY id"
        if limit == 0
            chatDatabase {|db| db.fetch(sql, id, channel, &callback)}
        else
            sql += " LIMIT ?"
            chatDatabase {|db| db.fetch(sql, id, channel, limit, &callback)}    
        end
    end
    
    def getPostsByIdInterval(channel, startId, endId, &callback)
        sql = SqlPostTemplate + "WHERE channel = ? AND post.id >= ? AND post.id <= ? ORDER BY id"
        chatDatabase {|db| db.fetch(sql, channel, startId, endId, &callback)}
    end

    def getPostsByDateInterval(channel, startDate, endDate, &callback)
        sql = SqlPostTemplate + "WHERE channel = ? AND date >= ? AND date <= ? ORDER BY id"
		chatDatabase {|db| db.fetch(sql, channel, startDate, endDate, &callback)}
    end

    def getPostsByStartDate(channel, startDate, &callback)
        sql = SqlPostTemplate + "WHERE channel = ? AND date >= ? ORDER BY id"
        chatDatabase {|db| db.fetch(sql, channel, startDate.strftime("%F %X"), &callback)}
    end
    
    def formatAsJson(posting)
        posting.each {|k, v| posting[k] = v.force_encoding('UTF-8') if v.class == String}
        if posting[:publicid] == 0 then
		    posting[:username] = nil
		    posting[:user_id] = nil
	    elsif not posting[:username] then
		    posting[:username] = '?'
	    end
	    posting.delete(:publicid)
        posting.merge!({'type' => 'post', 'color' => colorForName(posting[:name])})
        posting.to_json
    end

    private

    def colorForName(name)
        md5 = Digest::MD5.new
        r = md5.hexdigest('a' + name + 'a')[-7..-1].to_i(16) % 156 + 100
        g = md5.hexdigest('b' + name + 'b')[-7..-1].to_i(16) % 156 + 100
        b = md5.hexdigest('c' + name + 'c')[-7..-1].to_i(16) % 156 + 100
        r.to_s(16) + g.to_s(16) + b.to_s(16)
    end

    #Create a new connection for each query to avoid connection timeouts
    def chatDatabase
		Sequel.connect($sqlConfig) {|db|
		    db.run("SET NAMES UTF8mb4")
            yield(db)
        }
    end
end
