# Geänderte Konfiguration in rubychat-config.rb speichern

$sqlConfig = {:adapter => "mysql2", :host => "localhost",
	:database => "Datenbankname", :username => "Benutzername", :password => "Passwort"}

$scgiPort = 20000
$wsPort = 21000 

$wsPingInterval = 60
$wsFailsToTimeout = 3

$hostname = "chat.foo.bar" #Muss geändert werden, z.B. localhost für lokales Testen

$secureCookies = true #False, falls lokal entwickelt wird (ohne https)