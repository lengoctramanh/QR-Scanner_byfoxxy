USE qr_authenticity_db;

CREATE TABLE IF NOT EXISTS brand_registration_requests (
    request_id           VARCHAR(50)  PRIMARY KEY,
    reserved_account_id  VARCHAR(50)  NOT NULL UNIQUE,
    reserved_brand_id    VARCHAR(50)  NOT NULL UNIQUE,

    full_name            VARCHAR(100) NOT NULL,
    dob                  DATE         NOT NULL,
    gender               ENUM('male', 'female', 'other', 'secret') NULL,

    email                VARCHAR(100) NOT NULL,
    phone                VARCHAR(20)  NULL,
    password_hash        VARCHAR(255) NOT NULL,

    brand_name           VARCHAR(100) NOT NULL,
    tax_id               VARCHAR(50)  NOT NULL,
    website              VARCHAR(255) NULL,
    industry             VARCHAR(100) NULL,
    product_categories   TEXT         NULL,
    attachment_urls      JSON         NULL,

    request_status       ENUM('PENDING', 'UNDER_REVIEW', 'REJECTED', 'ACCOUNT_CREATED')
                         NOT NULL DEFAULT 'PENDING',
    admin_note           TEXT         NULL,
    reviewed_by_admin_id VARCHAR(50)  NULL,
    reviewed_at          TIMESTAMP    NULL DEFAULT NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_brand_registration_admin
      FOREIGN KEY (reviewed_by_admin_id)
      REFERENCES accounts(account_id)
      ON DELETE SET NULL
);

CREATE INDEX idx_brand_registration_status_created
ON brand_registration_requests(request_status, created_at);

CREATE INDEX idx_brand_registration_email
ON brand_registration_requests(email);

CREATE INDEX idx_brand_registration_phone
ON brand_registration_requests(phone);

CREATE INDEX idx_brand_registration_tax_id
ON brand_registration_requests(tax_id);
