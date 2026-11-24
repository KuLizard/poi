DROP PROCEDURE IF EXISTS sp_users;

DELIMITER //

CREATE PROCEDURE sp_users(
    IN p_opcion VARCHAR(20),
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_pass VARCHAR(255)
)
BEGIN

    CASE p_opcion

        WHEN 'registrar' THEN

            INSERT INTO users (
                username,
                email,
                pass
            )
            VALUES (
                p_username,
                p_email,
                p_pass
            );

            SELECT LAST_INSERT_ID() AS id;

        WHEN 'login' THEN

            SELECT
                id,
                username,
                email,
                pass,
                created_at
            FROM users
            WHERE email = p_email
            LIMIT 1;

    END CASE;

END //

DELIMITER ;