-- Xóa cơ sở dữ liệu (database) nếu nó đã tồn tại để tránh lỗi trùng lặp khi chạy lại script
DROP DATABASE IF EXISTS qr_authenticity_db;

-- Tạo database mới, thiết lập bộ mã utf8mb4 để hỗ trợ tốt tiếng Việt và cả Emoji 🚀
CREATE DATABASE qr_authenticity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Lệnh báo cho MySQL biết: "Từ bây giờ, hãy áp dụng các lệnh tạo bảng bên dưới vào database này"
USE qr_authenticity_db;

-- ==========================================
-- PHẦN 1: HỆ THỐNG TÀI KHOẢN & ĐỊNH DANH 
-- ==========================================

CREATE TABLE accounts (
    account_id VARCHAR(50) PRIMARY KEY, -- Khóa chính (duy nhất). Dùng chuỗi tối đa 50 ký tự (UUID) để hacker không đoán được ID.
    full_name VARCHAR(100) NOT NULL,    -- Họ và tên, tối đa 100 ký tự. NOT NULL: Bắt buộc phải nhập.
    dob DATE,                           -- Ngày tháng năm sinh (Định dạng YYYY-MM-DD). Không có NOT NULL tức là được phép để trống.
    gender ENUM('male', 'female', 'other', 'secret'), -- Giới tính: Bắt buộc chỉ được chọn 1 trong 4 giá trị này.
    email VARCHAR(100) UNIQUE NOT NULL, -- Email tối đa 100 ký tự. UNIQUE: Không được trùng với email khác trong hệ thống.
    phone VARCHAR(20) UNIQUE,           -- Số điện thoại, cũng không được phép trùng lặp.
    password_hash VARCHAR(255) NOT NULL,-- Mật khẩu đã được mã hóa (băm), không bao giờ lưu mật khẩu gốc.
    role ENUM('admin', 'brand', 'user') NOT NULL, -- Phân quyền tài khoản.
    status ENUM('active', 'banned', 'pending') DEFAULT 'pending', -- Trạng thái. DEFAULT: Nếu không nhập, mặc định là 'pending' (chờ duyệt).
    avatar_url VARCHAR(255),            -- Đường dẫn (link) tới ảnh đại diện của user.
    terms_accepted BOOLEAN DEFAULT TRUE,-- Xác nhận đồng ý điều khoản. Mặc định là TRUE (Đúng).
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tự động lưu ngày giờ lúc tài khoản được tạo ra.
    last_login_at TIMESTAMP NULL,       -- Thời điểm đăng nhập cuối. Cho phép NULL (vì mới tạo chưa đăng nhập).
    reset_otp VARCHAR(10),              -- Lưu mã OTP dùng để lấy lại mật khẩu (tối đa 10 ký tự).
    otp_expiry DATETIME                 -- Thời gian mã OTP sẽ hết hạn.
);

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,    -- Khóa chính của bảng người dùng cuối.
    account_id VARCHAR(50) NOT NULL,    -- Tham chiếu đến tài khoản nào.
    -- Khóa ngoại: Liên kết account_id của bảng này với account_id của bảng accounts. 
    -- ON DELETE CASCADE: Nếu tài khoản bên bảng accounts bị xóa, thông tin user này cũng tự động bốc hơi theo.
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

CREATE TABLE brands (
    brand_id VARCHAR(50) PRIMARY KEY,   -- Khóa chính của bảng Thương hiệu.
    account_id VARCHAR(50) NOT NULL,    -- Thương hiệu này do tài khoản nào quản lý.
    brand_name VARCHAR(100) NOT NULL,   -- Tên thương hiệu hiển thị.
    logo_url VARCHAR(255),              -- Link ảnh logo thương hiệu.
    tax_id VARCHAR(50) NOT NULL,        -- Mã số thuế (Rất quan trọng để xác minh doanh nghiệp).
    website VARCHAR(255),               -- Link website doanh nghiệp.
    industry VARCHAR(100),              -- Lĩnh vực/Ngành nghề kinh doanh.
    product_categories TEXT,            -- Danh mục sản phẩm (Dùng TEXT vì có thể rất dài).
    verified BOOLEAN DEFAULT FALSE,     -- Dấu tích xanh xác minh doanh nghiệp. Mặc định là FALSE (Chưa xác minh).
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE -- Xóa tài khoản -> Xóa luôn thương hiệu.
);

-- ==========================================
-- PHẦN 2: QUẢN LÝ SẢN XUẤT & LÔ HÀNG 
-- ==========================================

CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY, -- Khóa chính của Sản phẩm.
    brand_id VARCHAR(50) NOT NULL,      -- Sản phẩm này thuộc thương hiệu nào.
    product_name VARCHAR(255) NOT NULL, -- Tên sản phẩm.
    description TEXT,                   -- Mô tả chi tiết sản phẩm.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tự động lưu thời gian tạo sản phẩm.
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE -- Xóa thương hiệu -> Xóa mọi sản phẩm của họ.
);

CREATE TABLE batches (
    batch_id VARCHAR(50) PRIMARY KEY,   -- Khóa chính của Lô hàng.
    product_id VARCHAR(50) NOT NULL,    -- Lô này chứa sản phẩm nào.
    batch_code VARCHAR(100) UNIQUE NOT NULL, -- Mã lô do nhà máy đánh (Ví dụ: LOHANG_T1). Phải là duy nhất.
    manufacture_date DATE NOT NULL,     -- Ngày sản xuất (Bắt buộc).
    expiry_date DATE,                   -- Ngày hết hạn. (Để trống được vì có sản phẩm không có hạn sử dụng).
    quantity INT NOT NULL,              -- Số lượng sản phẩm trong lô (kiểu số nguyên).
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian tạo lô lên hệ thống.
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE -- Xóa sản phẩm -> Xóa luôn các lô hàng của nó.
);

-- ==========================================
-- PHẦN 3: LÕI MÃ QR & TRUY XUẤT 
-- ==========================================

CREATE TABLE qr_codes (
    qr_id VARCHAR(50) PRIMARY KEY,      -- ID nội bộ để quản lý mã QR trong Database.
    qr_code_string VARCHAR(255) UNIQUE NOT NULL, -- Chuỗi mã hóa thực tế in trên tem (Ví dụ: abcxyz123). Rất quan trọng!
    product_id VARCHAR(50) NOT NULL,    -- Mã QR này dán lên sản phẩm nào.
    batch_id VARCHAR(50) NOT NULL,      -- Thuộc lô hàng nào.
    
    status ENUM('NEW', 'ACTIVATED', 'SUSPICIOUS', 'BLOCKED') DEFAULT 'NEW', -- Trạng thái vòng đời của mã (Mới, Đã kích hoạt, Khả nghi, Bị khóa).
    scan_limit INT DEFAULT 5,           -- Số lần quét tối đa cho phép trước khi cảnh báo (Mặc định 5 lần).
    total_scan INT DEFAULT 0,           -- Tổng số lần mã này đã bị quét (Mới tạo nên bằng 0).
    
    first_scan_at DATETIME NULL,        -- Lưu thời gian quét lần đầu tiên (Giúp phát hiện kích hoạt bảo hành).
    last_scan_at DATETIME NULL,         -- Lưu thời gian quét gần nhất.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian tạo mã QR trên hệ thống.
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE, -- Xóa sản phẩm -> Xóa hết QR của nó.
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE       -- Xóa lô hàng -> Xóa hết QR của lô đó.
);

-- Bảng Log chuyên sâu: Nơi ghi lại lịch sử TẤT CẢ các lần quét mã (Lõi của hệ thống chống giả)
CREATE TABLE scan_logs (
    scan_id VARCHAR(50) PRIMARY KEY,    -- ID của từng lần quét.
    qr_code_input VARCHAR(255) NOT NULL,-- Chuỗi mà người dùng quét được (Dùng để biết họ đã quét cái gì kể cả mã đó là giả).
    qr_id VARCHAR(50) NULL,             -- Trỏ tới mã QR thật trong DB. Sẽ là NULL nếu chuỗi họ quét là mã fake không có trong hệ thống.
    account_id VARCHAR(50) NULL,        -- Ai là người quét? Khách vãng lai thì để NULL, user có app đăng nhập thì lưu ID.
    ip_address VARCHAR(50),             -- Địa chỉ IP của mạng người quét (Dùng để chống spam IP).
    location VARCHAR(255),              -- Vị trí quét (Parse từ IP hoặc GPS từ điện thoại).
    device_info VARCHAR(255),           -- Thông tin thiết bị (Ví dụ: iPhone 14 Pro Max, Safari).
    scan_result ENUM('VALID', 'FAKE', 'SUSPICIOUS', 'BLOCKED', 'EXPIRED') NOT NULL, -- Kết quả trả về cho người dùng lúc đó là gì.
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời điểm thực hiện cú quét.
    
    FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id) ON DELETE CASCADE, -- Xóa mã QR -> Xóa luôn lịch sử quét của nó.
    -- ON DELETE SET NULL: Nếu người dùng xóa tài khoản (account_id bị xóa), ta KHÔNG xóa dòng log này mà chỉ set account_id thành NULL. (Để giữ lại dữ liệu thống kê chống hàng giả).
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL 
);

-- ==========================================
-- PHẦN 4: TỐI ƯU HÓA HIỆU SUẤT (INDEXING)
-- ==========================================

-- Tạo chỉ mục (Index) giống như tạo Mục lục cho một quyển sách.
-- Thay vì MySQL phải lật từng trang để tìm mã QR, nó chỉ cần nhìn vào mục lục và nhảy thẳng tới dòng cần thiết.
-- Điều này giúp App phản hồi kết quả quét cực kỳ nhanh dù database có hàng triệu mã QR.
CREATE INDEX idx_qr_code_string ON qr_codes(qr_code_string);

-- Giúp tốc độ thống kê/lọc các mã bị 'FAKE' hoặc 'SUSPICIOUS' cho admin/brand nhanh hơn rất nhiều.
CREATE INDEX idx_scan_result ON scan_logs(scan_result);