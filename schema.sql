-- Copyright (C) 2004-2018 Quod Erat Demonstrandum e.V. <webmaster@qed-verein.de>

-- This file is part of QED-Chat.

-- QED-Chat is free software: you can redistribute it and/or modify it
-- under the terms of the GNU Affero General Public License as
-- published by the Free Software Foundation, either version 3 of the
-- License, or (at your option) any later version.

-- QED-Chat is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU Affero General Public License for more details.

-- You should have received a copy of the GNU Affero General Public
-- License along with QED-Chat.  If not, see
-- <http://www.gnu.org/licenses/>.

CREATE TABLE post (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    date DATETIME NOT NULL,
    ip CHAR(15) DEFAULT NULL,
    delay INTEGER unsigned DEFAULT NULL,
    name TINYTEXT,
    message MEDIUMTEXT,
    bottag TINYINT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    channel VARCHAR(100) NOT NULL,
    publicid BOOLEAN NOT NULL
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(40) NOT NULL
);

INSERT INTO user VALUES (1, 'Testuser', SHA1(CONCAT('Testuser', '1234')));
