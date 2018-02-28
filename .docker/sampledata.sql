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

INSERT INTO user VALUES (2, 'Testuser0', SHA1(CONCAT('Testuser0', '1234')));
INSERT INTO user VALUES (3, 'Testuser1', SHA1(CONCAT('Testuser1', '1234')));
INSERT INTO user VALUES (4, 'Testuser2', SHA1(CONCAT('Testuser2', '1234')));
INSERT INTO user VALUES (5, 'Testuser3', SHA1(CONCAT('Testuser3', '1234')));
INSERT INTO user VALUES (6, 'Testuser4', SHA1(CONCAT('Testuser4', '1234')));
INSERT INTO user VALUES (7, 'Testuser5', SHA1(CONCAT('Testuser5', '1234')));
INSERT INTO user VALUES (8, 'Testuser6', SHA1(CONCAT('Testuser6', '1234')));
INSERT INTO user VALUES (9, 'Testuser7', SHA1(CONCAT('Testuser7', '1234')));
INSERT INTO user VALUES (10, 'Testuser8', SHA1(CONCAT('Testuser8', '1234')));
INSERT INTO user VALUES (11, 'Testuser9', SHA1(CONCAT('Testuser9', '4321')));

INSERT INTO post VALUES (1, NOW(), '0.0.0.0', 0, 'Admin', 'Das ist ein Testserver! Posts werden nur temporär gespeichert!', 0, 1, '', TRUE);
INSERT INTO post VALUES (2, NOW(), '0.0.0.0', 0, 'Admin', 'Das ist ein Testserver! Posts werden nur temporär gespeichert!', 0, 1, '', TRUE);
INSERT INTO post VALUES (3, NOW(), '0.0.0.0', 0, 'Admin', 'Das ist ein Testserver! Posts werden nur temporär gespeichert!', 0, 1, '', TRUE);
