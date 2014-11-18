<?php


function renderLoginForm($errorMessage = null)
{
	//$html = "<p style='margin: 1cm auto; text-align: center'>\n";
	//$html .= "<b>Regeln:</b> Die Nutzung des Chats verpflichtet zur Einhaltung geltenden Rechts ";
	//$html .= "sowie der üblichen Netiquette. Bei Verstößen kann eine Sperrung des Zugangs erfolgen.\n";
	//$html .= "</p>\n";

	$html = sprintf("<form action='%s' method='post'>\n", htmlEscape(urlLogin()));
	$html .= "<fieldset style='width: 20em; margin: auto' class='box'>\n";
	$html .= "<legend>Anmeldung</legend>\n";

	$html .= "<table>\n";
	$html .= " <tr>\n";
	$html .= "  <td><label for='input_username'>Benutzername:</label></td>\n";
	$html .= "  <td><input name='username' id='input_username'></td>\n";
	$html .= " </tr>\n";
	$html .= " <tr>\n";
	$html .= "  <td><label for='password'>Passwort:</label></td>\n";
	$html .= "  <td><input type='password' name='password' id='input_password'></td>\n";
	$html .= " </tr>\n";
	$html .= " <tr><td colspan='2'><input type='submit' name='login' value='Einloggen'></td></tr>\n";
	$html .= "</table>\n";
	$html .= sprintf("<p>%s</p>\n", $errorMessage);
	$html .= "</fieldset>\n";
	$html .= "</form>\n";

	$html .= "<p style='margin: 1cm auto; text-align: center'>\n";
	$html .= "<b>Hinweis:</b> Der Username und das Passwort ist dasselbe wie für die QED-Datenbank. <br />";
	$html .= sprintf("Bei Problemen bitte an <a href='mailto:%s'>%s</a> schreiben.\n", htmlEscape(ADMIN_EMAIL),
		htmlEscape(ADMIN_EMAIL));
	$html .= "</p>\n";
	return $html;
}

function renderSimpleLayout($title, $content)
{
	$html = "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01//EN' 'http://www.w3.org/TR/html4/strict.dtd'>";
	$html .= "<html>\n" . "<head>\n";
	$html .= "<link rel='stylesheet' href='screen.css'>\n";
	$html .= "<meta http-equiv='content-type' content='text/html; charset=utf-8'>\n";
	$html .= "<title>" . htmlEscape($title) . "</title>\n";
	$html .= "</head>\n<body>\n" . $content . "</body>\n</html>\n";
	return $html;
}

?>
