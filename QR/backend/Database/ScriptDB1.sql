DROP DATABASE IF EXISTS qr_anticounterfeit_hub;
CREATE DATABASE qr_anticounterfeit_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qr_anticounterfeit_hub;


-- HỆ THỐNG TÀI KHOẢN & ĐỊNH DANH 


CREATE TABLE accounts (
    account_id VARCHAR(50) PRIMARY KEY, -- UUID để chống IDOR
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'brand', 'supplier', 'user') NOT NULL,
    status ENUM('active', 'banned', 'pending') DEFAULT 'pending', -- Nên để mặc định là pending nếu cần xác thực email
    avatar_url VARCHAR(255), -- Lưu đường dẫn ảnh như đã bàn ở trên
    terms_accepted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    last_login_at TIMESTAMP NULL, -- Lần đăng nhập gần nhất
    reset_otp VARCHAR(10),
    otp_expiry DATETIME
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
    brand_owner VARCHAR(100) NOT NULL, 
    brand_name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255),
    tax_id VARCHAR(50) NOT NULL,
    website VARCHAR(255),
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


-- QUẢN LÝ SẢN XUẤT & LÔ HÀNG 

CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY,
    brand_id VARCHAR(50) NOT NULL,
    suppiler_id VARCHAR(50) NOT NULL, 
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE
);

CREATE TABLE batches (
    batch_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    batch_code VARCHAR(100) UNIQUE NOT NULL, -- Ví dụ: LOHANG_THANG5_2024
    manufacture_date DATE NOT NULL,
    expiry_date DATE, -- Có thể NULL nếu sản phẩm không có hạn
    quantity INT NOT NULL, -- Số lượng QR cần tạo cho lô này
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- PHẦN 3: LÕI MÃ QR & TRUY XUẤT (Kết hợp tối ưu)

CREATE TABLE qr_codes (
    qr_id VARCHAR(50) PRIMARY KEY,
    qr_code_string VARCHAR(255) UNIQUE NOT NULL, -- Chuỗi mã hóa thực tế
    batch_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50), -- Đại lý/Nhà phân phối đang cầm mã này
    
    -- Trạng thái vòng đời của mã
    status ENUM('NEW', 'ACTIVATED', 'SUSPICIOUS', 'BLOCKED') DEFAULT 'NEW',
    
    -- Cơ chế cảnh báo
    scan_limit INT DEFAULT 5, 
    total_scan INT DEFAULT 0,
    
    first_scan_at DATETIME NULL,
    last_scan_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

-- Bảng Log chuyên sâu: Lưu mọi hành động quét kể cả quét mã giả
CREATE TABLE scan_logs (
    scan_id VARCHAR(50) PRIMARY KEY,
    qr_code_input VARCHAR(255) NOT NULL, -- Chuỗi người dùng đã quét (dùng để bắt mã fake)
    qr_id VARCHAR(50) NULL, -- Sẽ NULL nếu mã quét không tồn tại trong hệ thống
    account_id VARCHAR(50) NULL, -- Khách vãng lai thì NULL, user đăng nhập thì lưu ID
    
    ip_address VARCHAR(50),
    location VARCHAR(255), -- Ví dụ: "Hồ Chí Minh, Việt Nam" (Parse từ IP bên Node.js)
    device_info VARCHAR(255),
    
    scan_result ENUM('VALID', 'FAKE', 'SUSPICIOUS', 'BLOCKED', 'EXPIRED') NOT NULL,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL
);

-- Tạo Index để tối ưu tốc độ tìm kiếm khi quét QR (Rất quan trọng cho Backend)
CREATE INDEX idx_qr_code_string ON qr_codes(qr_code_string);
CREATE INDEX idx_scan_result ON scan_logs(scan_result);