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

# Geaenderte Konfiguration in rubychat-config.rb speichern

$sqlConfig = {:adapter => "mysql2", :host => "localhost",
	:database => "Datenbankname", :username => "Benutzername", :password => "Passwort"}

$scgiPort = 20000
$wsPort = 21000 

$wsPingInterval = 60
$wsFailsToTimeout = 3

$hostname = "chat.foo.bar" #Muss geaendert werden, z.B. localhost fuer lokales Testen

$secureCookies = true #False, falls lokal entwickelt wird (ohne https)

$tokenExpirationSeconds = 3600 * 24 * 90
$tokenExpirationLeeway = 30
$tokenSecret = nil