USE qr_authenticity_db;

DROP TRIGGER IF EXISTS trg_session_set_expiry_on_insert;

DELIMITER $$

CREATE TRIGGER trg_session_set_expiry_on_insert
BEFORE INSERT ON account_sessions
FOR EACH ROW
BEGIN
    IF NEW.last_active_at IS NULL THEN
        SET NEW.last_active_at = CURRENT_TIMESTAMP;
    END IF;

    IF NEW.expires_at IS NULL OR NEW.expires_at <= NEW.last_active_at THEN
        SET NEW.expires_at = DATE_ADD(NEW.last_active_at, INTERVAL 4 DAY);
    END IF;
END$$

DELIMITER ;
