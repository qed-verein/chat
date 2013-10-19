<?php

require_once ("data.php");
require_once ("common7.php");
require_once ("login.php");

header("Content-Type: application/xhtml+xml");

?>

<!DOCTYPE HTML>
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta name="robots" content="noindex, nofollow" />
		<meta http-equiv="content-type" content="text/html; charset=utf-8" />
		<script type="text/javascript" src="jquery-2.0.2.js"></script>
		<script type="text/javascript" src="v7.js"></script>

	</head>
	<body>
		<?php

			session_start();
			
			$_SESSION['access'] = false;

			// Anonymous
			if (!empty($_REQUEST['anonym']) && !REQUIRE_LOGIN) {
				$_SESSION['userid'] = 0;
				$_SESSION['anonym'] = 1;
				$_SESSION['access'] = true;
			}

			// Logout
			if (!empty($_REQUEST['logout'])) {
				$_SESSION['access'] = false;
				session_destroy();
				unset($_SESSION['userid']);
			}

			// Login
			if (!empty($_REQUEST['username']) && !empty($_REQUEST['password'])) {
				$userid = do_login($_REQUEST['username'],$_REQUEST['password']);
				if ($userid == 0) { ?>
					<p> Entschuldigung, aber die Logindaten waren nicht korrekt. </p>
				<?php
				} else {
					$_SESSION['userid'] = $userid;
					$_SESSION['anonym'] = 0;
					$_SESSION['access'] = true;
				}
			}
			
			// Ask for login, if activated and not having access yet
			if (!$_SESSION['access']) { ?>
				<p>
					<form action="v7.php" method="post">
						<input name="username" placeholder="Name" />
						<input name="password" placeholder="Password" type="password" />
						<input type="submit" value="Login" />
					</form>
				</p>
				<?php if (!REQUIRE_LOGIN) { 
					echo '<p>Sonst: <a href="v7.php?' . myUrlSetOption("anonym", "1").  '">Anonymer Zugang</a></p>';
				}
			} else { ?>
				<div id="messages"></div>
				<div id="post"></div>
				<div id="channel"></div>
				<div id="config"></div>
				<p>Du bist drin :3 - <a href="v7.php?logout=1">Ausloggen.</a></p>
			<?php }
		?>
	</body>
</html>
