# ONLY USE THIS CONFIG FOR TESTING. IT IS NOT SECURE TO OPERATE A CHAT SERVER LIKE THIS!!!

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

$sqlConfig = {:adapter => "mysql2", :host => "mysql_chat",
:database => "chat", :username => "root", :password => "0nL9a3nR8sV5ODtQfNs463ssKLpo19Lf"}

$scgiPort = 20000
$wsPort = 21000 

$wsPingInterval = 60
$wsFailsToTimeout = 3

$hostname = "localhost"

$secureCookies = false

$tokenExpirationSeconds = 3600 * 24 * 90
$tokenExpirationLeeway = 30
$tokenSecret = "topsecret"