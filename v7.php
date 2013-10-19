<?php

require_once ("data.php");
require_once ("common7.php");
require_once ("login.php");

header("Content-Type: application/xhtml+xml");

?>

<!DOCTYPE HTML>
<html>
	<head>
		<meta name="robots" content="noindex, nofollow" />
		<meta http-equiv="content-type" content="text/html; charset=utf-8" />
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
					<p> <a href="javascript:history.back()">Zurück</a> </p>
				<?php
					exit ();
				} else {
					$_SESSION['userid'] = $userid;
					$_SESSION['anonym'] = 0;
					$_SESSION['access'] = true;
				}
			}
			
			// Ask for login, if activated and not having access yet
			if (!$_SESSION['access']) { ?>
				<p>
					<form action="v7.php">
						<input name="username" placeholder="Name" />
						<input name="password" placeholder="Password" type="password" />
						<input type="submit" value="Login" />
					</form>
				</p>
				<?php if (!REQUIRE_LOGIN) { ?>
				<p>Sonst: <a href="v7.php?anonym=1">Anonymer Zugang</a>.</p>
					<?php }
			} else { ?>
				<a href="v7.php?logout=1">Ausloggen.</a>
			<?php }
		?>
	</body>
</html>
