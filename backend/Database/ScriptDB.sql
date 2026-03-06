DROP DATABASE IF EXISTS qr_authenticity_db;
CREATE DATABASE qr_authenticity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qr_authenticity_db;

CREATE TABLE accounts (
    account_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE, 
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'brand', 'supplier', 'user') NOT NULL,
    avatar_url VARCHAR(255),
    terms_accepted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    dob DATE,
    gender ENUM('male', 'female', 'other', 'secret'),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

CREATE TABLE brands (
    brand_id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    business_license_url VARCHAR(255), -
    legal_representative VARCHAR(100),
    headquarters_address TEXT,
    brand_name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    industry VARCHAR(100),
    product_categories TEXT,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);
CREATE TABLE suppliers (
    supplier_id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    supplier_type ENUM('individual', 'company') NOT NULL,
    service_types VARCHAR(255), 
    operating_region VARCHAR(100),
    business_scale VARCHAR(50),
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

CREATE TABLE qr_codes (
    qr_id VARCHAR(50) PRIMARY KEY,
    qr_code_string VARCHAR(100) UNIQUE NOT NULL, 
    brand_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50), 
    product_name VARCHAR(255) NOT NULL,
    is_system_generated BOOLEAN DEFAULT FALSE,
    issued_date DATETIME NOT NULL, 
    expiry_date DATETIME,
    scan_limit INT DEFAULT 5, 
    current_scan_count INT DEFAULT 0,
    status ENUM('active', 'expired', 'suspected_fake', 'disabled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

CREATE TABLE qr_scans (
    scan_id VARCHAR(50) PRIMARY KEY,
    qr_id VARCHAR(50) NOT NULL,
    account_id VARCHAR(50),
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    is_flagged BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL
);