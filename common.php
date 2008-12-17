<?php

require("usermod.php");

	function do_post ($post)
	{
		mysql_pconnect (SQL_HOST, SQL_USER, SQL_PASSWORD);
		mysql_select_db (SQL_DATABASE);
		$bottag=!empty($post['bottag'])?1:0;
		mysql_query ('INSERT INTO ' . SQL_TABLE . ' (date, delay, ip, name, message, bottag) VALUES ("' . $post["date"] . '", ' . $post["delay"] . ', "' . $post["ip"] . '", "' . escape_string($post["name"]) . '", "' . escape_string ($post["message"]) . '",'.$bottag.')');
		
		$recorded = true;
		
		$mem = shm_attach (MEM_SOCKETS_KEY, MEM_SOCKETS_SIZE);
		$sem = sem_get (SEM_SOCKETS_KEY);
		sem_acquire ($sem);
		$listeners = @shm_get_var ($mem, MEM_SOCKETS_VAR);
		if ($listeners)
			$listeners = array_unique ($listeners);
		else
			$listeners = array ();
		shm_put_var ($mem, MEM_SOCKETS_VAR, array ());
		sem_release ($sem);
		
		$socket = socket_create (AF_UNIX, SOCK_DGRAM, 0);
		socket_set_option ($socket, SOL_SOCKET, SO_REUSEADDR, 1);
		socket_set_nonblock ($socket);
		# socket_set_timeout($socket,1);		
		$sem = sem_get (SEM_POST_KEY);
		sem_acquire ($sem);
		@unlink ("sockets/post.sock");
		socket_bind ($socket, "sockets/post.sock");
		foreach ($listeners as $name)
			@socket_sendto ($socket, "news", 4, 0, is_array ($name) ? $name[0] : $name);
		sem_release ($sem);
	}

	function output_header ($type)
	{
		header ("Cache-Control: no-cache"); 

		if ($type == "html")
			header ("Content-Type: text/html; charset=utf-8");
		else if ($type == "javascript")
			header ("Content-Type: text/plain; charset=utf-8");
		else if ($type == "xml")
			header ("Content-Type: text/xml; charset=utf-8");
	}

	function output_prefix ($type)
	{
		if ($type == "html")
			echo "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.01//EN\" \"http://www.w3.org/TR/html4/strict.dtd\">\n"
				. "\n"
				. "<html>\n"
				. "\t<head>\n"
				. "\t\t<meta name=\"robots\" content=\"noindex, nofollow\">\n"
				. "\t\t<meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">\n"
				. "\t\t<meta http-equiv=\"cache-control\" content=\"no-cache\">\n"
				. "\t\t<title>Datenaustauschfenster</title>\n";
		else if ($type == "xml")
			echo "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n"
				. "<content>\n";
	}
	
	function output_suffix ($type)
	{
		if ($type == "html")
			echo "\t</head>\n"
				. "\t\n"
				. "\t<body>\n"
				. "\t\t<p></p>\n"
				. "\t</body>\n"
				. "</html>\n";
		else if ($type == "xml")
			echo "</content>\n";
	}
	
	function output_error ($type, $number, $description, $file, $line)
	{
		if ($type == "html")
			echo "\t\t<script type=\"text/javascript\">SpawnError ($number, \"" . rawurlencode ($description) . "\", \"$file\", $line);</script>"
				. "\t</head>\n"
				. "\t<body>\n"
				. "\t</body>\n"
				. "</html>\n";
		else if ($type == "javascript")
			echo "SpawnError ($number, \"" . rawurlencode ($description) . "\", \"$file\", $line);\n";
		else if ($type == "xml")
			echo "\t<error number=\"$number\" description=\"$description\" file=\"$file\" line=\"$line\"/>\n"
				. "</content>\n";
	}
	
	function output_feedback ($type)
	{
		if ($type == "html")
			echo "\t\t<script type=\"text/javascript\">parent.Ok ();</script>\n";
		else if ($type == "javascript")
			echo "Ok ();\n";
		else if ($type == "xml")
			echo "\t<ok/>\n";
	}
	
	function output_line ($type, $array)
	{
		$coloredarray = $array;
		$coloredarray["color"] = get_color($array["name"]);
		$coloredarray = applymods($coloredarray);
		if ($type == "html")
			return "\t\t<script type=\"text/javascript\">parent." . format_post_javascript ($coloredarray) . "</script>\n";
		else if ($type == "javascript")
			return format_post_javascript ($coloredarray) . "\n";
		else if ($type == "xml")
			return "\t" . format_post_xml ($coloredarray) . "\n";
	}

	function get_key_generator ()
	{
		$fileGenerator = fopen (SECURE_POSTS_GENERATOR_FILE, "r+");
		fscanf ($fileGenerator, "%u", $generator);
		rewind ($fileGenerator);
		fwrite ($fileGenerator, ($generator + 1) . " ");
		return $generator;
	}

	function is_key_valid ($key)
	{
		if (strlen ($key) != 40)
			return false;

		$generator = substr ($key, 0, 8);
		$hash = substr ($key, 8, 32);

		$string = $generator . "undefinednullSendefensterundefined";
		for ($i = 0; $i != strlen ($string); ++$i)
			$string[$i] = chr (127 - ord ($string[$i]));

		if ($hash != md5 ($string))
			return false;

		$keys = file (SECURE_POSTS_KEYS_FILE);
		foreach ($keys as $used)
			if ($generator == chop ($used))
				return false;

		$keys = fopen (SECURE_POSTS_KEYS_FILE, "a");
		fwrite ($keys, $generator . "\n");
		fclose ($keys);
		return true;
	}

	function demagicalize_string ($string)
	{
		if (get_magic_quotes_gpc ())
			$string = stripslashes ($string);

		return $string;
	}

	function escape_string ($string)
	{
		return strtr (addslashes ($string), array ("\n" => '\n', "\r" => '\r'));
	}
	
	function get_color ($name)
	{
		srand (hexdec (crc32 ($name)));
		return dechex (rand (100, 255)) . dechex (rand (100, 255)) . dechex (rand (100, 255));
	//	$spam = (hexdec(crc32 ($name)) % 155)+100;
	//	return dechex ($spam) . dechex ($spam) . dechex ($spam);
	}
	
	function show_links ($string)
	{
		return preg_replace ('#(http://|https://|ftp://)([\w\&.~%\/?\#=@:\[\]+\$\,-]*)#sm', '<a href="' . URL_REDIRECT . '\1\2">\1\2</a>', $string);
	}

	function format_post ($array, $options = array ())
	{
		$color = $array["color"];

		$difference = $array["id"] - $array["delay"] - 1;
		$delay = ($options["delay"] ? ($array["delay"] == "" ? "(-)" : ($difference < 0 ? "(?)" : ($difference > 9 ? "(9+)" : "($difference)"))) . " " : "");
		$info = '<td class="info">' . $delay . $array["date"] . "</td>";

		$ip = ($options["ip"] ? '<td class="ip">' . $array["ip"] . "</td>" : "");
		
		$text = nl2br (htmlspecialchars ($array["name"], ENT_QUOTES, "UTF-8"));
		if ($options["links"])
			$text = show_links ($text);
		$name = '<td class="name" style="color:#' . $color . '">' . $text . ":</td>";
		
		$text = nl2br (htmlspecialchars ($array["message"], ENT_QUOTES, "UTF-8"));
		if ($options["links"])
			$text = show_links ($text);
		$message = '<td class="message" style="color:#' . $color . '">' . $text . "</td>";
		
		return "<tr>$info$ip$name$message</tr>";
	}

	function format_post_xml ($array)
	{
		/*if (substr($array["ip"], 0, 7) == "129.217")
			$color = "ff55cc";
		else*/
		//	$color = get_color ($array["name"]);
		$color = $array["color"];

		$name = rawurlencode ($array["name"]);

		if($name == "Chatter")
			$message = "!STFU Chatter";
		else
			$message = rawurlencode ($array["message"]);

		$ip = $array["ip"];
	/*	if($ip != "87.174.105.89")
		{
			$iplist = array("129.217.129.132", "141.84.69.20", "87.174.86.106", "82.113.106.16", "138.246.7.139", "91.45.163.78", "217.89.77.90", "134.2.62.65");
			$iplist = array("n00b", "spam", "blah", "blubb", "blubblubb!", "v1AgRR4, \\/41IuM, P3Ni5EnL4Rgem3ntp1LL", "unbekanntes Xorgobjekt", "*help me I'm a shizophrenic!!111elf");
			$ip = "";
			$name ="";
		}*/

		/* Vandalismus ausserhalb der usermods :-) - cian
		*/

		return '<post id="' . $array["id"] . '" name="' . $name . '" message="' . $message . '" date="' . $array["date"] . '" ip="' . $ip . '" delay="' . $array["delay"] . '" color="' . $color . '" bottag="'.$array['bottag'].'" />';
	}

	function format_post_javascript ($array)
	{
		return 'AddPost (' . $array["id"] . ', "' . rawurlencode ($array["name"]) . '", "' . rawurlencode ($array["message"]) . '", "' . $array["date"] . '", "' . $array["ip"] . '", "' . $array["delay"] . '", "' . (!empty($array["hollow"]) ? "555555" : $array["color"]) . '", "'.$array['bottag'].'");';
	}
	
	function get_date ($string)
	{
		sscanf (date ("i_H_d_m_Y"), "%d_%d_%d_%d_%d", $n, $h, $d, $m, $y);
		++$n;
		sscanf ($string, "%d_%d_%d_%d_%d", $n, $h, $d, $m, $y);
		return date ("Y-m-d H-i-s", mktime ($h, $n, 0, $m, $d, $y));
	}
	
	function get_query_value ($resource)
	{
		$temp = mysql_fetch_array ($resource);
		return $temp[0];
	}

?>