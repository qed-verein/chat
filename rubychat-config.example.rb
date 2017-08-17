# Geänderte Konfiguration in rubychat-config.rb speichern

$sqlConfig = {:adapter => "mysql2", :host => "localhost",
	:database => "Datenbankname", :username => "Benutzername", :password => "Passwort"}

$scgiPort = 20000
$wsPort = 21000 

$wsPingInterval = 60
$wsFailsToTimeout = 3

$hostname = "chat.foo.bar"

$secureCookies = true #False, falls lokal entwickelt wird (ohne https)