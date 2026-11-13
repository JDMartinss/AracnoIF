-- AracnoIF simplificado: executar somente em banco vazio.
SET NAMES utf8mb4;


CREATE TABLE login_attempt (
	id INTEGER NOT NULL AUTO_INCREMENT,
	`key` VARCHAR(64) NOT NULL,
	created DATETIME NOT NULL,
	PRIMARY KEY (id)
)

;

CREATE INDEX ix_login_attempt_created ON login_attempt (created);

CREATE INDEX ix_login_attempt_key ON login_attempt (`key`);


CREATE TABLE room (
	id INTEGER NOT NULL AUTO_INCREMENT,
	name VARCHAR(120) NOT NULL,
	floor INTEGER NOT NULL,
	node VARCHAR(80) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (node)
)

;


CREATE TABLE user (
	id INTEGER NOT NULL AUTO_INCREMENT,
	name VARCHAR(120) NOT NULL,
	email VARCHAR(180) NOT NULL,
	identifier VARCHAR(40) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	`role` VARCHAR(20) NOT NULL,
	active BOOL NOT NULL,
	semester VARCHAR(20),
	course VARCHAR(120),
	villain VARCHAR(60),
	avatar TEXT,
	PRIMARY KEY (id),
	UNIQUE (email),
	UNIQUE (identifier)
)

;


CREATE TABLE class_group (
	id INTEGER NOT NULL AUTO_INCREMENT,
	name VARCHAR(120) NOT NULL,
	subject VARCHAR(120) NOT NULL,
	teacher_id INTEGER NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(teacher_id) REFERENCES user (id)
)

;


CREATE TABLE lesson (
	id INTEGER NOT NULL AUTO_INCREMENT,
	class_id INTEGER NOT NULL,
	room_id INTEGER NOT NULL,
	start DATETIME NOT NULL,
	end DATETIME NOT NULL,
	status VARCHAR(20) NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(class_id) REFERENCES class_group (id),
	FOREIGN KEY(room_id) REFERENCES room (id)
)

;

CREATE INDEX ix_lesson_start ON lesson (start);


CREATE TABLE membership (
	id INTEGER NOT NULL AUTO_INCREMENT,
	user_id INTEGER NOT NULL,
	class_id INTEGER NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT uq_membership UNIQUE (user_id, class_id),
	FOREIGN KEY(user_id) REFERENCES user (id),
	FOREIGN KEY(class_id) REFERENCES class_group (id)
)

;


CREATE TABLE notice (
	id INTEGER NOT NULL AUTO_INCREMENT,
	class_id INTEGER,
	kind VARCHAR(20) NOT NULL,
	lesson_id INTEGER,
	user_id INTEGER NOT NULL,
	body TEXT NOT NULL,
	created DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(class_id) REFERENCES class_group (id),
	FOREIGN KEY(lesson_id) REFERENCES lesson (id),
	FOREIGN KEY(user_id) REFERENCES user (id)
)

;

CREATE INDEX ix_notice_class_id ON notice (class_id);
