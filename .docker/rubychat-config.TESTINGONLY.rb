# ONLY USE THIS CONFIG FOR TESTING. IT IS NOT SECURE TO OPERATE A CHAT SERVER LIKE THIS!!!

$sqlConfig = {:adapter => "mysql2", :host => "mysql_chat",
:database => "chat", :username => "root", :password => "0nL9a3nR8sV5ODtQfNs463ssKLpo19Lf"}

$scgiPort = 20000
$wsPort = 21000 

$wsPingInterval = 60
$wsFailsToTimeout = 3

$hostname = "localhost"

$secureCookies = false