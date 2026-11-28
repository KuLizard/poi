ALTER TABLE users ADD COLUMN medallas TEXT NULL;

ALTER TABLE chats
ADD COLUMN usuarioAdmin int NULL AFTER nombre;