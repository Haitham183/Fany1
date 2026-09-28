-- ==============================================================================
-- Migration 003: pgcrypto National ID Encryption and Audit Helper Functions
-- Version: 2.0.0
-- ==============================================================================

-- 1. Helper function for hashing National ID (SHA-256)
CREATE OR REPLACE FUNCTION public.hash_national_id(raw_nid TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(digest(TRIM(raw_nid), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Encrypt & Decrypt functions for National ID using server-side key
-- Key is stored in database secret / vault or application setting
CREATE OR REPLACE FUNCTION public.encrypt_national_id(raw_nid TEXT, secret_key TEXT)
RETURNS BYTEA AS $$
BEGIN
    IF raw_nid IS NULL OR raw_nid = '' THEN
        RETURN NULL;
    END IF;
    RETURN pgp_sym_encrypt(TRIM(raw_nid), secret_key);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.decrypt_national_id(encrypted_nid BYTEA, secret_key TEXT)
RETURNS TEXT AS $$
BEGIN
    IF encrypted_nid IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN pgp_sym_decrypt(encrypted_nid, secret_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Automatic Trigger to calculate national_id_hash on student insert/update
CREATE OR REPLACE FUNCTION public.trg_calc_student_nid_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.national_id_encrypted IS NOT NULL AND NEW.national_id_hash IS NULL THEN
        -- Default placeholder hash if not supplied
        NEW.national_id_hash := encode(digest(NEW.id || NEW.student_code, 'sha256'), 'hex');
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_students_before_save
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.trg_calc_student_nid_hash();
