<?php
require ("data.php");
require ("common.php");
ignore_user_abort (true);

$touchme = inotify_init();
$touchme_deleteme = inotify_add_watch ($touchme, TOUCH_FILE, IN_ATTRIB);

touch (TOUCH_FILE);

while (!connection_aborted()) {
  if (inotify_read($touchme) !== FALSE) {
    echo "touched!\n"; flush();
  }
  usleep(100000);
}
  

?>