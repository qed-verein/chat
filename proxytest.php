<?php
class proxytest
{
	function proxy_test($host)
	{
		$http_ports=array(80,88,1080,3128,6588,8000,8080,8888);
		$socks_ports=array(1080,3128);
		foreach ($http_ports as $port)
		{
			$aktiv=$this->http_get_test($host,$port);
			if ($aktiv)
				return $port;
			//echo $port.' '.$aktiv.'<br />';
			
		}
		//foreach ($this->$socks_ports as $port)
		//	echo $port.' '.socks4_test($host,$port).'<br />';
	}
	function http_get_test($host,$port)
	{
		$senden="GET http://www.google.com HTTP/1.0\nHost: www.google.com\n\n";
		$empf="Server: gws";
		$fp = @fsockopen($host, $port, $errno, $errstr, 1);
		if (!$fp)
			return false;
		stream_set_timeout($fp,1);
		fwrite($fp, $senden);
		while (!feof($fp)) {
			$text=fgets($fp, 1024);
			if (strpos($text,$empf)!==false)
				return true;
	   	}	
	   return false;
	}
	function socks4_test($host,$port)
	{
		$senden_dec="4 1 0 80 66 102 7 99";
		$senden_dec=explode(' ',$senden_dec);
		$senden='';
		foreach ($senden_dec as $zeichen)
			$senden.=chr($zeichen);
		$empf="Server: gws";
		$fp = @fsockopen($host, $port, $errno, $errstr, 1);
		//FIXME mifritscher:  nicht nur ports testen, sondern auch die Antwort...
		if (!$fp)
			return false;
		stream_set_timeout($fp,1);
		return true;
		/*fwrite($fp, $senden);
		$i=0;
		while (!feof($fp)) {
	      $i++;
		  $text=fgets($fp, 10);
		  echo $i.' '.$text.'<br />';
	   }		
	   return false;*/
	}
}
?>
