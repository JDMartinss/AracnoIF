-- Execute uma vez somente em bases existentes da primeira versão.
ALTER TABLE notice ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'info';
ALTER TABLE notice ADD COLUMN lesson_id INTEGER NULL;
ALTER TABLE notice ADD CONSTRAINT fk_notice_lesson FOREIGN KEY (lesson_id) REFERENCES lesson (id);
