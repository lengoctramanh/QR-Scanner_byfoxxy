DROP DATABASE IF EXISTS qr_authenticity_db;
CREATE DATABASE qr_authenticity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qr_authenticity_db;


-- ============================================================
-- PHẦN 1: HỆ THỐNG TÀI KHOẢN & ĐỊNH DANH
-- Nguyên tắc: 1 bảng accounts là gốc chung cho mọi role.
-- Mỗi role (user, brand) có bảng profile riêng liên kết vào.
-- ============================================================

-- Bảng trung tâm: Lưu thông tin đăng nhập và phân quyền của TẤT CẢ người dùng hệ thống
CREATE TABLE accounts (
    -- Khóa chính dạng UUID v4 (ví dụ: "550e8400-e29b-41d4-a716-446655440000")
    -- Dùng chuỗi thay vì INT AUTO_INCREMENT để hacker không đoán được ID tuần tự
    account_id      VARCHAR(50)  PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,                -- Họ và tên đầy đủ, bắt buộc nhập
    dob             DATE NOT NULL,                                 -- Ngày sinh (YYYY-MM-DD) bắt buộc
    gender          ENUM('male', 'female', 'other', 'secret') NOT NULL DEFAULT 'secret', -- Giới tính, chỉ chấp nhận 4 giá trị cố định
    email           VARCHAR(100) UNIQUE NOT NULL,         -- Email đăng nhập, duy nhất toàn hệ thống, bắt buộc
    phone           VARCHAR(20)  UNIQUE,                  -- Số điện thoại, không bắt buộc nhưng nếu nhập thì phải duy nhất
    password_hash   VARCHAR(255) NOT NULL,                -- Mật khẩu đã được băm từ password + email. TUYỆT ĐỐI không lưu plain text
    role            ENUM('admin', 'brand', 'user') NOT NULL,         -- Vai trò trong hệ thống, bắt buộc phải chọn
    status          ENUM('active', 'banned', 'pending') DEFAULT 'pending', -- Trạng thái. Mặc định 'pending' (chờ kích hoạt)
    avatar_url      VARCHAR(255),                         -- Đường dẫn ảnh đại diện (link S3, CDN...)
    terms_accepted  BOOLEAN      DEFAULT TRUE,            -- Đã đồng ý điều khoản sử dụng chưa. Mặc định TRUE
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,  -- Tự động ghi thời điểm tạo tài khoản
    last_login_at   TIMESTAMP    NULL,                    -- Thời điểm đăng nhập gần nhất. NULL nếu chưa login lần nào
    reset_otp       VARCHAR(10),                          -- Mã OTP 6-10 ký tự dùng để lấy lại mật khẩu
    otp_expiry      DATETIME                              -- Thời điểm mã OTP hết hạn (thường 5-15 phút)
);

-- Bảng profile mở rộng cho người dùng cuối (role = 'user')
-- Thiết kế tách riêng để sau này dễ thêm cột đặc thù cho user mà không làm phình bảng accounts
CREATE TABLE users (
    user_id         VARCHAR(50)  PRIMARY KEY,             -- ID nội bộ của user profile, dùng UUID
    account_id      VARCHAR(50)  NOT NULL UNIQUE,         -- Tham chiếu tài khoản gốc. UNIQUE: 1 account chỉ có đúng 1 user profile
    -- Nếu tài khoản gốc bị xóa → profile user cũng tự động xóa theo (CASCADE)
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- Bảng profile mở rộng cho thương hiệu/doanh nghiệp (role = 'brand')
-- [v2.3] Thêm 3 cột xác minh trực tiếp vào đây thay vì ALTER TABLE sau
CREATE TABLE brands (
    brand_id              VARCHAR(50)  PRIMARY KEY,       -- ID nội bộ của brand, dùng UUID
    account_id            VARCHAR(50)  NOT NULL UNIQUE,   -- Tham chiếu tài khoản gốc. UNIQUE: 1 account = 1 brand
    brand_name            VARCHAR(300) NOT NULL,          -- Tên thương hiệu hiển thị ra ngoài (ví dụ: "Vinamilk")
    logo_url              VARCHAR(255),                   -- Link ảnh logo thương hiệu
    tax_id                VARCHAR(50)  NOT NULL UNIQUE,   -- Mã số thuế doanh nghiệp, duy nhất trên toàn quốc
    website               VARCHAR(255),                   -- Địa chỉ website chính thức
    address               VARCHAR(255),                   -- Địa chỉ doanh nghiệp hoặc văn phòng liên hệ
    industry              VARCHAR(100) NOT NULL,          -- Ngành nghề kinh doanh (ví dụ: "Thực phẩm & Đồ uống")
    product_categories    VARCHAR(100) NOT NULL,          -- Danh mục sản phẩm kinh doanh, tối đa 100 ký tự theo form đăng ký
    verified              BOOLEAN      DEFAULT FALSE,
    verification_status   ENUM('PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMITTED')
                          NOT NULL DEFAULT 'PENDING_REVIEW',  -- Mặc định PENDING_REVIEW khi mới tạo

    verified_at           TIMESTAMP    NULL DEFAULT NULL,     -- Thời điểm Admin bấm duyệt. NULL = chưa được duyệt
    verified_by_admin_id  VARCHAR(50)  NULL DEFAULT NULL,     -- account_id của Admin đã thực hiện duyệt cuối cùng
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by_admin_id) REFERENCES accounts(account_id) ON DELETE SET NULL
);

-- ── [v2.3] LỊCH SỬ XÉT DUYỆT THƯƠNG HIỆU ──────────────────
-- Mỗi hành động (Brand nộp / Admin xem / Admin duyệt / từ chối...)
-- đều tạo ra 1 bản ghi mới → giữ nguyên toàn bộ lịch sử thẩm định.
-- Bảng này là append-only (chỉ INSERT, không UPDATE/DELETE).
CREATE TABLE brand_verification_requests (
    verification_id   VARCHAR(50)  PRIMARY KEY,           -- ID phiếu xét duyệt, dùng UUID

    brand_id          VARCHAR(50)  NOT NULL,              -- Thương hiệu nào đang được xét duyệt

    -- Loại hành động được ghi lại:
    -- SUBMITTED      : Brand vừa nộp hồ sơ (Trigger C tự tạo khi INSERT vào brands)
    -- REVIEWING      : Admin mở hồ sơ ra xem xét
    -- APPROVED       : Admin xác nhận đủ điều kiện → Brand chính thức (Trigger D tự kích hoạt)
    -- REJECTED       : Admin từ chối, Brand phải nộp lại
    -- REQUESTED_MORE : Admin yêu cầu bổ sung tài liệu (chưa từ chối hẳn)
    -- RESUBMITTED    : Brand nộp bổ sung sau khi bị yêu cầu
    action            ENUM(
                          'SUBMITTED',
                          'REVIEWING',
                          'APPROVED',
                          'REJECTED',
                          'REQUESTED_MORE',
                          'RESUBMITTED'
                      ) NOT NULL,

    -- Ai thực hiện hành động này? (Admin hoặc Brand)
    performed_by_id   VARCHAR(50)  NOT NULL,              -- account_id của người thực hiện
    performed_role    ENUM('admin', 'brand') NOT NULL,    -- Để dễ phân biệt ai làm gì trong timeline

    -- Nội dung ghi chú kèm theo:
    -- Admin từ chối → bắt buộc ghi lý do (enforce ở tầng ứng dụng)
    -- Admin yêu cầu thêm → ghi rõ cần tài liệu gì
    -- Brand nộp bổ sung → giải thích đã bổ sung gì
    note              TEXT         NULL,

    -- Tài liệu đính kèm (Giấy phép kinh doanh, chứng nhận ISO, hợp đồng...)
    -- Lưu dạng mảng JSON: ["https://s3.../gplkd.pdf", "https://s3.../iso.pdf"]
    attachment_urls   JSON         NULL,

    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Thời điểm hành động được ghi lại

    FOREIGN KEY (brand_id)        REFERENCES brands(brand_id)     ON DELETE CASCADE,
    -- Dùng RESTRICT: không nên xóa tài khoản admin/brand còn lịch sử xét duyệt
    FOREIGN KEY (performed_by_id) REFERENCES accounts(account_id) ON DELETE RESTRICT
);

-- ============================================================
-- BẢNG MỚI: ĐĂNG KÝ THƯƠNG HIỆU (Quy trình duyệt trước khi tạo user)
-- ============================================================
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
    brand_name           VARCHAR(300) NOT NULL,
    tax_id               VARCHAR(50)  NOT NULL,
    website              VARCHAR(255) NULL,
    industry             VARCHAR(100) NOT NULL,
    product_categories   VARCHAR(100) NOT NULL,
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

-- ============================================================
-- BANG ANH HE THONG (INPUT/OUTPUT CHO QR SCAN)
-- Muc dich: luu duong dan anh goc va anh da xu ly de OpenCV doc/ghi sau nay.
-- ============================================================
CREATE TABLE pictures (
    picture_id              VARCHAR(50) PRIMARY KEY,
    picture_group           ENUM('QR_SCAN') NOT NULL DEFAULT 'QR_SCAN',
    capture_source          ENUM('camera', 'gallery') NOT NULL,
    original_file_name      VARCHAR(255) NOT NULL,
    original_mime_type      VARCHAR(100) NOT NULL,
    original_storage_path   VARCHAR(500) NOT NULL,
    original_public_url     VARCHAR(500) NOT NULL,
    processed_file_name     VARCHAR(255) NULL,
    processed_storage_path  VARCHAR(500) NULL,
    processed_public_url    VARCHAR(500) NULL,
    processing_status       ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    processing_note         TEXT NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at            TIMESTAMP NULL DEFAULT NULL,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- PHẦN 2: SẢN PHẨM & LÔ HÀNG
-- Nguyên tắc: Brand là chủ sở hữu, Admin chỉ được xem.
-- Mọi thay đổi phải đi qua bảng approval_requests (Phần 4).
-- ============================================================

-- Bảng sản phẩm: Mỗi thương hiệu có thể có nhiều sản phẩm
CREATE TABLE products (
    product_id       VARCHAR(50)  PRIMARY KEY,            -- ID sản phẩm, dùng UUID
    brand_id         VARCHAR(50)  NOT NULL,               -- Sản phẩm này thuộc thương hiệu nào
    product_name     VARCHAR(255) NOT NULL,               -- Tên sản phẩm (ví dụ: "Sữa tươi TH True Milk 1L")
    description      TEXT,                                -- Mô tả chi tiết sản phẩm, không giới hạn độ dài
    image_url        VARCHAR(255),                        -- Link ảnh sản phẩm chính
    -- URL này được nhúng vào QR lộ thiên để khi quét (chưa cào) sẽ dẫn đến trang này
    general_info_url VARCHAR(255),
    manufacturer_name VARCHAR(255),                       -- Nhà sản xuất in trên bao bì hoặc hồ sơ công bố
    origin_country   VARCHAR(255),                        -- Nguồn gốc xuất xứ hoặc quốc gia sản xuất
    quality_certifications TEXT,                          -- Danh sách chứng nhận chất lượng như ISO, GMP, HACCP...
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,               -- Tự động ghi thời điểm tạo
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Tự cập nhật khi có thay đổi
    -- Xóa thương hiệu → xóa toàn bộ sản phẩm của thương hiệu đó
    FOREIGN KEY (brand_id) REFERENCES brands(brand_id) ON DELETE CASCADE
);

-- Bảng lô hàng: Mỗi sản phẩm được sản xuất theo từng lô (batch)
-- Mỗi lô hàng sẽ gắn với một tập hợp mã QR riêng
CREATE TABLE batches (
    batch_id         VARCHAR(50)  PRIMARY KEY,            -- ID lô hàng, dùng UUID
    product_id       VARCHAR(50)  NOT NULL,               -- Lô này là của sản phẩm nào
    batch_code       VARCHAR(100) UNIQUE NOT NULL,        -- Mã lô do nhà máy đặt (ví dụ: "LOT-2025-01-A"), phải duy nhất
    manufacture_date DATE         NOT NULL,               -- Ngày sản xuất, bắt buộc nhập
    expiry_date      DATE,                                -- Ngày hết hạn sử dụng. Không bắt buộc (vì có hàng không hết hạn)
    quantity         INT          NOT NULL CHECK (quantity > 0), -- Số lượng sản phẩm trong lô, phải là số dương
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,               -- Tự động ghi thời điểm tạo lô
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Tự cập nhật khi có thay đổi

    -- Xóa sản phẩm → xóa toàn bộ các lô hàng của sản phẩm đó
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);


-- ============================================================
-- PHẦN 3: QUY TRÌNH YÊU CẦU & PHÊ DUYỆT MÃ QR
-- Luồng: Brand tạo request → Admin duyệt → Hệ thống sinh mã
-- ============================================================
-- Bảng yêu cầu cấp mã QR: Brand gửi yêu cầu, Admin xem xét và phê duyệt
CREATE TABLE qr_code_requests (
    request_id            VARCHAR(50)  PRIMARY KEY,       -- ID yêu cầu, dùng UUID
    brand_id              VARCHAR(50)  NOT NULL,          -- Thương hiệu nào gửi yêu cầu
    product_id            VARCHAR(50)  NOT NULL,          -- Yêu cầu mã cho sản phẩm nào
    batch_id              VARCHAR(50)  NOT NULL,          -- Thuộc lô hàng nào
    requested_quantity    INT          NOT NULL CHECK (requested_quantity > 0), -- Số lượng mã cần cấp, phải > 0
    -- Cách thức sinh mã: Brand tự gửi file mã có sẵn, hay nhờ hệ thống sinh tự động
    generation_method     ENUM('brand_provided', 'system_generated') NOT NULL,
    -- Vòng đời của yêu cầu: Mới → Duyệt/Từ chối → Đang xử lý → Hoàn tất
    status                ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED') DEFAULT 'PENDING',
    -- Thông tin do Brand điền khi gửi yêu cầu
    brand_note            TEXT,                           -- Ghi chú của Brand (ví dụ: "Cần gấp trước 15/8")
    source_file_url       VARCHAR(255),                   -- Link file mã do Brand tự cung cấp (chỉ dùng khi method = 'brand_provided')
    -- Thông tin do Admin điền khi xử lý yêu cầu
    processed_by_admin_id VARCHAR(50)  NULL,              -- Admin nào đã xử lý yêu cầu này
    admin_note            TEXT,                           -- Ghi chú của Admin (lý do từ chối, hướng dẫn bổ sung...)
    output_file_url       VARCHAR(255),                   -- Link file mã xuất cho Brand tải về sau khi hoàn tất
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP, -- Thời điểm Brand gửi yêu cầu
    processed_at          TIMESTAMP    NULL,              -- Thời điểm Admin bắt đầu xử lý (duyệt hoặc từ chối)
    completed_at          TIMESTAMP    NULL,              -- Thời điểm mã đã được sinh xong và file sẵn sàng
    FOREIGN KEY (brand_id)              REFERENCES brands(brand_id),
    FOREIGN KEY (product_id)            REFERENCES products(product_id),
    FOREIGN KEY (batch_id)              REFERENCES batches(batch_id),
    -- Nếu tài khoản admin bị xóa, vẫn giữ lại lịch sử yêu cầu, chỉ set NULL thôi
    FOREIGN KEY (processed_by_admin_id) REFERENCES accounts(account_id) ON DELETE SET NULL
);
-- ============================================================
-- PHẦN 4: CƠ CHẾ PHÊ DUYỆT 2 CHIỀU (ADMIN <-> BRAND)
-- Nguyên tắc: Không ai được UPDATE products/batches trực tiếp.
-- Mọi thay đổi phải đi qua bảng này và được bên kia xác nhận.
-- ============================================================

CREATE TABLE approval_requests ( -- xx
    approval_id       VARCHAR(50)  PRIMARY KEY,           -- ID phiếu yêu cầu thay đổi, dùng UUID
    -- Bên ĐỀ XUẤT: có thể là Brand muốn sửa thông tin, hoặc Admin yêu cầu Brand cập nhật
    initiated_by_id   VARCHAR(50)  NOT NULL,              -- account_id của người đề xuất
    initiated_role    ENUM('admin', 'brand') NOT NULL,    -- Role của người đề xuất (để biết ai cần xác nhận phía kia)
    -- Xác định đối tượng cần thay đổi (sản phẩm hay lô hàng)
    target_table      ENUM('products', 'batches') NOT NULL, -- Bảng bị tác động
    target_id         VARCHAR(50)  NOT NULL,              -- ID của bản ghi cụ thể cần thay đổi
    -- Lưu dưới dạng JSON để linh hoạt: thêm/bớt cột không cần sửa schema
    original_data     JSON         NOT NULL,              -- Snapshot toàn bộ dữ liệu gốc TRƯỚC khi sửa (dùng để rollback)
    proposed_changes  JSON         NOT NULL,              -- Chỉ những trường cần thay đổi (ví dụ: {"product_name": "Tên mới"})
    change_reason     TEXT,                               -- Lý do cần thay đổi (bắt buộc điền ở tầng ứng dụng)
    -- Vòng đời phiếu: Chờ → Duyệt/Từ chối/Hủy
    status            ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',

    -- Bên XÁC NHẬN: Brand xác nhận nếu Admin đề xuất và ngược lại
    confirmed_by_id   VARCHAR(50)  NULL,                  -- account_id của người xác nhận. NULL khi chưa có ai xác nhận
    confirmed_at      TIMESTAMP    NULL,                  -- Thời điểm xác nhận hoặc từ chối
    rejection_reason  TEXT         NULL,                  -- Lý do từ chối (bắt buộc điền nếu status = 'REJECTED')

    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP, -- Thời điểm phiếu được tạo

    FOREIGN KEY (initiated_by_id) REFERENCES accounts(account_id),
    -- Người xác nhận bị xóa tài khoản → chỉ SET NULL, không mất phiếu
    FOREIGN KEY (confirmed_by_id) REFERENCES accounts(account_id) ON DELETE SET NULL
);

-- ============================================================
-- PHẦN 5: LÕI MÃ QR - CƠ CHẾ 2 LỚP (PUBLIC + HIDDEN PIN)
-- Lớp 1 (Public Token): In trên tem, ai quét cũng thấy → thông tin chung
-- Lớp 2 (Hidden PIN):   Dưới lớp cào, nhập kết hợp → xác thực thật/giả
-- ============================================================



-- ============================================================
CREATE TABLE qr_codes (
    qr_id            VARCHAR(50)  PRIMARY KEY,            -- ID noi bo quan ly ma QR, dung UUID
    -- LOP 1: MA LO THIEN
    -- Day la chuoi thuc te duoc encode vao hinh QR in tren bao bi.
    -- Khi scan se tra ve URL dang: https://app.com/scan?t={qr_public_token}
    qr_public_token  VARCHAR(255) UNIQUE NOT NULL,
    -- LOP 2: MA XAC THUC QR 1
    -- Luu duoi dang HASH. Tuyet doi khong luu gia tri PIN/plain text goc.
    hidden_pin_hash  VARCHAR(255) NOT NULL,
    source           ENUM('brand_provided', 'system_generated') NOT NULL,
    product_id       VARCHAR(50)  NOT NULL,
    batch_id         VARCHAR(50)  NOT NULL,
    request_id       VARCHAR(50)  NULL,
    status           ENUM('NEW', 'ACTIVATED', 'SUSPICIOUS', 'BLOCKED', 'EXPIRED') DEFAULT 'NEW',
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    effective_from   DATETIME     NULL,
    activated_at     DATETIME     NULL,
    expires_at       DATETIME     NULL,
    scan_limit       INT          DEFAULT 5,
    total_public_scans  INT       DEFAULT 0,
    total_pin_attempts  INT       DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id),
    FOREIGN KEY (request_id) REFERENCES qr_code_requests(request_id) ON DELETE SET NULL
);

-- ============================================================
-- PHAN 2B: NHAN / TEM QR CUA TUNG LO HANG
-- Muc dich: Moi batch gom nhieu tem nho (label tag), moi tem chi co QR Web Link va QR 1.
-- DB luu metadata duong dan anh de frontend render truc tiep tu he thong file.
-- Luu y: phai dat sau qr_codes vi batch_qr_labels co khoa ngoai den qr_codes.
-- ============================================================

-- Moi tem nho vat ly gan voi dung 1 qr_id va co sequence trong batch.
CREATE TABLE batch_qr_labels (
    label_id           VARCHAR(50)  PRIMARY KEY,
    batch_id           VARCHAR(50)  NOT NULL,
    qr_id              VARCHAR(50)  NOT NULL,
    sequence_no        INT          NOT NULL CHECK (sequence_no > 0),
    label_code         VARCHAR(120) NOT NULL UNIQUE,
    storage_root_path  VARCHAR(500) NOT NULL,
    width_cm           DECIMAL(4,2) NOT NULL DEFAULT 5.00,
    height_cm          DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    qr_size_cm         DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_batch_label_sequence (batch_id, sequence_no),
    UNIQUE KEY uq_qr_single_label (qr_id),
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (qr_id)    REFERENCES qr_codes(qr_id) ON DELETE CASCADE
);

-- Moi tem co nhieu asset anh: QR Web Link, QR 1 va label frame.
CREATE TABLE batch_qr_label_assets (
    asset_id           VARCHAR(50)  PRIMARY KEY,
    label_id           VARCHAR(50)  NOT NULL,
    asset_type         ENUM('website_qr', 'qr_1', 'label_frame') NOT NULL,
    file_name          VARCHAR(255) NOT NULL,
    file_format        ENUM('svg', 'png', 'jpg', 'webp') NOT NULL DEFAULT 'svg',
    storage_path       VARCHAR(500) NOT NULL,
    public_url         VARCHAR(500) NOT NULL,
    width_cm           DECIMAL(4,2) NULL,
    height_cm          DECIMAL(4,2) NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_label_asset_type (label_id, asset_type),
    FOREIGN KEY (label_id) REFERENCES batch_qr_labels(label_id) ON DELETE CASCADE
);


-- ============================================================
-- PHẦN 6: DẤU VÂN TAY THIẾT BỊ (DEVICE FINGERPRINTING)
-- Mục đích: Nhận diện khách vãng lai (Guest) không có tài khoản
-- Cách hoạt động: Tổng hợp nhiều đặc điểm trình duyệt/thiết bị
-- rồi hash lại thành 1 chuỗi định danh duy nhất.
-- ============================================================
-- Bảng lưu "chứng minh thư" của từng thiết bị
CREATE TABLE device_fingerprints (
    fingerprint_id    VARCHAR(50)  PRIMARY KEY,           -- ID nội bộ, dùng UUID
    -- Chuỗi hash tổng hợp từ: User-Agent + Canvas fingerprint + WebGL renderer
    -- + Timezone + Language + Screen resolution + Installed fonts...
    -- Đây là "khóa nhận dạng" chính của thiết bị
    fingerprint_hash  VARCHAR(255) UNIQUE NOT NULL,
    -- ── DỮ LIỆU THÔ (lưu để debug và tái tạo fingerprint khi cần) ──
    user_agent        TEXT,                               -- Chuỗi User-Agent đầy đủ
    screen_resolution VARCHAR(30),                        -- Độ phân giải màn hình (ví dụ: "390x844")
    timezone          VARCHAR(100),                       -- Múi giờ (ví dụ: "Asia/Ho_Chi_Minh")
    language          VARCHAR(20),                        -- Ngôn ngữ trình duyệt (ví dụ: "vi-VN")
    platform          VARCHAR(100),                       -- Nền tảng thiết bị (ví dụ: "iPhone", "Win32", "Linux x86_64")
    ip_address        VARCHAR(50),                        -- Địa chỉ IP tại thời điểm fingerprint được tạo lần đầu
    first_seen_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,               -- Lần đầu thiết bị này xuất hiện trong hệ thống
    last_seen_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Lần cuối thiết bị này hoạt động
);
-- Bảng ghi lại AI là người ĐẦU TIÊN kích hoạt hidden PIN của mỗi mã QR
-- Đây là bản ghi QUAN TRỌNG NHẤT cho cơ chế chống giả mạo
-- UNIQUE(qr_id) đảm bảo: mỗi mã QR chỉ được kích hoạt đúng 1 lần đầu tiên
CREATE TABLE qr_pin_activations (
    activation_id               VARCHAR(50)  PRIMARY KEY,     -- ID lần kích hoạt, dùng UUID
    qr_id                       VARCHAR(50)  NOT NULL UNIQUE,  -- Trỏ tới mã QR. UNIQUE: mỗi mã chỉ có 1 bản ghi kích hoạt
    -- Ai kích hoạt? Một trong hai hoặc cả hai sẽ có giá trị:
    activated_by_account_id     VARCHAR(50)  NULL,            -- Có tài khoản đăng nhập → lưu account_id. Không có → NULL
    activated_by_fingerprint_id VARCHAR(50)  NULL,            -- Có fingerprint thiết bị → lưu fingerprint_id. Không lấy được → NULL
    activation_ip               VARCHAR(50),                  -- Địa chỉ IP tại thời điểm kích hoạt (để điều tra địa lý)
    activated_at                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP, -- Thời điểm kích hoạt chính xác
    FOREIGN KEY (qr_id)                        REFERENCES qr_codes(qr_id),
    -- Tài khoản bị xóa → giữ lại lịch sử kích hoạt, chỉ SET NULL
    FOREIGN KEY (activated_by_account_id)      REFERENCES accounts(account_id)              ON DELETE SET NULL,
    -- Fingerprint bị xóa (hiếm xảy ra) → giữ lại lịch sử, chỉ SET NULL
    FOREIGN KEY (activated_by_fingerprint_id)  REFERENCES device_fingerprints(fingerprint_id) ON DELETE SET NULL
);

-- ============================================================
-- PHẦN 7: MASTER LOG - SỔ ĐEN BẤT BIẾN (IMMUTABLE GLOBAL LOG)
-- Nguyên tắc: Bảng này CHỈ INSERT. KHÔNG UPDATE. KHÔNG DELETE.
-- Không có updated_at, không có is_deleted. Đây là nguồn sự thật
-- duy nhất cho mọi cuộc điều tra chống hàng giả.
-- ============================================================

CREATE TABLE scan_global_logs (
    log_id                 VARCHAR(50)  PRIMARY KEY,      -- ID của từng sự kiện quét, dùng UUID
    -- ── INPUT NGƯỜI DÙNG GỬI LÊN (ghi đúng những gì nhận được) ──
    qr_public_token_input  VARCHAR(255) NOT NULL,         -- Chuỗi token người dùng quét được (kể cả mã giả)
    -- Nếu người dùng có nhập hidden PIN, lưu HASH của nó (không lưu PIN gốc)
    hidden_pin_input_hash  VARCHAR(255) NULL,
    -- ── LIÊN KẾT (dùng SET NULL để giữ log kể cả khi entity bị xóa) ──
    qr_id                  VARCHAR(50)  NULL,             -- Mã QR tương ứng trong DB. NULL nếu token không tồn tại (quét mã giả)
    batch_id               VARCHAR(50)  NULL,             -- Batch match duoc tu info QR hoac guest token de dashboard truy vet nhanh
    account_id             VARCHAR(50)  NULL,             -- Tài khoản thực hiện quét. NULL nếu là khách vãng lai
    fingerprint_id         VARCHAR(50)  NULL,             -- Fingerprint thiết bị. NULL nếu không lấy được
    -- ── PHÂN LOẠI SỰ KIỆN ───────────────────────────────────────
    -- PUBLIC_SCAN:      Quét mã lộ thiên (chưa cào lớp phủ)
    -- PIN_VERIFICATION: Quét + nhập hidden PIN (đã cào)
    -- TOKEN_SCAN:       Quét guest token/link token để mở lại kết quả cũ hoặc claim QR cho user
    scan_type              ENUM('PUBLIC_SCAN', 'PIN_VERIFICATION', 'TOKEN_SCAN') NOT NULL,
    -- Kết quả trả về cho người dùng tại thời điểm quét:
    -- INFO_SHOWN  → Hiển thị thông tin chung (PUBLIC_SCAN thành công)
    -- VALID       → Hàng thật (PIN đúng, kích hoạt lần đầu hoặc cùng thiết bị)
    -- FAKE        → Hàng giả (PIN sai)
    -- SUSPICIOUS  → Cảnh báo (PIN đúng nhưng từ thiết bị khác sau khi đã kích hoạt)
    -- BLOCKED     → Mã đã bị khóa
    -- EXPIRED     → Mã đã hết hạn bảo hành
    -- OWNED       → Mã hợp lệ nhưng đã bị user khác sở hữu nên không được claim lại
    scan_result            ENUM('INFO_SHOWN', 'VALID', 'FAKE', 'SUSPICIOUS', 'BLOCKED', 'EXPIRED', 'OWNED') NOT NULL,
    -- ── METADATA VỊ TRÍ & THIẾT BỊ ─────────────────────────────
    ip_address             VARCHAR(50),                   -- Địa chỉ IP của người quét
    location               VARCHAR(255),                  -- Vị trí parse từ IP hoặc GPS (ví dụ: "Quận 1, TP.HCM")
    device_info            VARCHAR(500),                  -- Thông tin thiết bị thô (ví dụ: "Samsung Galaxy S24 / Android 14")
    scanned_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP, -- Thời điểm quét chính xác đến giây
    -- !! KHÔNG CÓ updated_at, is_deleted, deleted_at !!
    -- Bảng này là bất biến (append-only). Không ai được sửa hay xóa.
    FOREIGN KEY (qr_id)          REFERENCES qr_codes(qr_id)                           ON DELETE SET NULL,
    FOREIGN KEY (batch_id)       REFERENCES batches(batch_id)                         ON DELETE SET NULL,
    FOREIGN KEY (account_id)     REFERENCES accounts(account_id)                      ON DELETE SET NULL,
    FOREIGN KEY (fingerprint_id) REFERENCES device_fingerprints(fingerprint_id)       ON DELETE SET NULL
);

-- ===========================================================
-- PHẦN 8: DANH MỤC CÁ NHÂN CỦA USER (SOFT-DELETE)
-- Nguyên tắc: User thấy "đã xóa" nhưng DB vẫn giữ nguyên.
-- Dùng cờ is_deleted_by_user = TRUE thay vì xóa dòng khỏi DB.
-- ============================================================

-- Bộ sưu tập mã QR mà User đã kích hoạt và bind vào tài khoản cá nhân
CREATE TABLE user_qr_collections (
    collection_id      VARCHAR(50)  PRIMARY KEY,          -- ID bản ghi bind, dùng UUID
    user_id            VARCHAR(50)  NOT NULL,             -- User nào đang sở hữu
    qr_id              VARCHAR(50)  NOT NULL,             -- Mã QR nào được bind

    bound_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP, -- Thời điểm bind mã vào tài khoản
    nickname           VARCHAR(100) NULL,                 -- Biệt danh user tự đặt cho sản phẩm này (ví dụ: "Sữa con nhỏ")
    personal_note      TEXT         NULL,                 -- Ghi chú cá nhân của user
    -- ── SOFT-DELETE ─────────────────────────────────────────────
    is_deleted_by_user BOOLEAN      DEFAULT FALSE,        -- Cờ xóa mềm: TRUE = User đã "xóa" trên app, DB vẫn giữ
    deleted_at         TIMESTAMP    NULL,                 -- Thời điểm user nhấn xóa. Trigger tự điền. NULL khi chưa xóa
    -- Ràng buộc: 1 user chỉ được bind 1 mã QR cụ thể đúng 1 lần, không duplicate
    UNIQUE KEY uq_user_qr_bind (user_id, qr_id),
    -- Ràng buộc nghiệp vụ mới: 1 mã QR chỉ có đúng 1 user sở hữu trong toàn hệ thống
    UNIQUE KEY uq_qr_single_owner (qr_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (qr_id)   REFERENCES qr_codes(qr_id)
);
-- Bảng ánh xạ lịch sử quét cá nhân của User sang Master Log
-- Mục đích: Cho phép User "xóa" lịch sử cá nhân mà KHÔNG ảnh hưởng scan_global_logs
CREATE TABLE user_scan_history (
    user_history_id    VARCHAR(50)  PRIMARY KEY,          -- ID bản ghi lịch sử cá nhân, dùng UUID
    user_id            VARCHAR(50)  NOT NULL,             -- User nào
    log_id             VARCHAR(50)  NOT NULL,             -- Tương ứng với bản ghi nào trong master log
    -- ── SOFT-DELETE ─────────────────────────────────────────────
    is_deleted_by_user BOOLEAN      DEFAULT FALSE,        -- Cờ xóa mềm: TRUE = ẩn khỏi lịch sử của user
    deleted_at         TIMESTAMP    NULL,                 -- Trigger tự điền khi user nhấn xóa. NULL = chưa xóa
    -- 1 user không được có 2 dòng trỏ vào cùng 1 log entry
    UNIQUE KEY uq_user_log (user_id, log_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (log_id)  REFERENCES scan_global_logs(log_id)
);

-- Guest token luu ket qua scan cua khach vang lai de mo lai tren moi thiet bi
-- va cho phep user dang nhap sau nay claim ma ve tai khoan cua minh.
CREATE TABLE guest_scan_tokens (
    guest_token_id       VARCHAR(50)  PRIMARY KEY,
    token_hash           VARCHAR(255) NOT NULL UNIQUE,
    qr_id                VARCHAR(50)  NULL,
    batch_id             VARCHAR(50)  NULL,
    source_log_id        VARCHAR(50)  NULL,
    scan_verdict         ENUM('GENUINE', 'INTACT', 'INFO', 'SUSPICIOUS', 'BLOCKED', 'EXPIRED', 'FAKE', 'OWNED') NOT NULL,
    response_code        VARCHAR(100) NULL,
    response_message     TEXT         NULL,
    result_snapshot_json JSON         NOT NULL,
    claim_url            VARCHAR(500) NOT NULL,
    qr_file_name         VARCHAR(255) NOT NULL UNIQUE,
    qr_storage_path      VARCHAR(500) NOT NULL,
    qr_public_url        VARCHAR(500) NOT NULL,
    claimed_by_user_id   VARCHAR(50)  NULL,
    claimed_at           TIMESTAMP    NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_resolved_at     TIMESTAMP    NULL,
    FOREIGN KEY (qr_id)              REFERENCES qr_codes(qr_id)          ON DELETE SET NULL,
    FOREIGN KEY (batch_id)           REFERENCES batches(batch_id)        ON DELETE SET NULL,
    FOREIGN KEY (source_log_id)      REFERENCES scan_global_logs(log_id) ON DELETE SET NULL,
    FOREIGN KEY (claimed_by_user_id) REFERENCES users(user_id)           ON DELETE SET NULL
);
-- ============================================================
-- PHẦN 12: QUẢN LÝ PHIÊN ĐĂNG NHẬP (SLIDING WINDOW TOKEN)
-- Cơ chế: Token sống 4 ngày. Mỗi lần hoạt động → tự gia hạn thêm 4 ngày.
-- Ngủ đông > 4 ngày → Token chết → Buộc đăng nhập lại.
-- Hỗ trợ đa thiết bị: 1 tài khoản có thể đăng nhập nhiều thiết bị cùng lúc.
-- ============================================================
CREATE TABLE account_sessions (
    session_id        VARCHAR(50)  PRIMARY KEY,           -- ID phiên đăng nhập, dùng UUID
    account_id        VARCHAR(50)  NOT NULL,              -- Phiên này thuộc tài khoản nào
    -- Token xác thực KHÔNG lưu dưới dạng plain text.
    -- Application giữ raw token (gửi qua header), DB chỉ lưu SHA-256(raw_token) để so sánh.
    token_hash        VARCHAR(255) NOT NULL UNIQUE,
    -- Thông tin thiết bị giúp user nhận ra "đây là phiên lạ, không phải tôi"
    device_info       VARCHAR(500) NULL,                   -- Mô tả thiết bị (ví dụ: "iPhone 16 Pro / iOS 18 / Safari 17")
    device_type       ENUM('mobile', 'tablet', 'desktop', 'unknown') DEFAULT 'unknown', -- Loại thiết bị
    ip_at_login       VARCHAR(50)  NULL,                   -- IP lúc đăng nhập tạo phiên
    location_at_login VARCHAR(255) NULL,                   -- Vị trí parse từ IP lúc đăng nhập
    -- ── SLIDING WINDOW ────────────────────────────────────────
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Thời điểm phiên được tạo (login lần đầu)
    -- Application Layer cập nhật cột này sau mỗi API request thành công.
    -- Trigger B sẽ lắng nghe thay đổi này và tự gia hạn expires_at.
    last_active_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Thời điểm hết hạn phiên. Trigger A (INSERT) và B (UPDATE) tự quản lý.
    -- DEFAULT CURRENT_TIMESTAMP là giá trị tạm thời; Trigger BEFORE INSERT sẽ ghi đè ngay lập tức.
    expires_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- ── THU HỒI THỦ CÔNG ──────────────────────────────────────
    is_revoked        BOOLEAN      DEFAULT FALSE,          -- Cờ thu hồi: TRUE = phiên bị vô hiệu hóa (logout/admin lock)
    revoked_at        TIMESTAMP    NULL,                   -- Thời điểm thu hồi. Trigger tự điền khi is_revoked flip TRUE
    revoked_reason    VARCHAR(255) NULL,                   -- Lý do: "User logout", "Admin force-revoke", "AUTO_EXPIRED"...
    -- Xóa tài khoản → tất cả phiên của tài khoản đó cũng bị xóa theo (GDPR compliance)
    FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
);

-- ============================================================
-- PHAN 13: ADMIN WEBSITE QR URL HISTORY
-- Muc dich: moi lan admin doi URL website chinh thi he thong sinh 1 QR moi
-- va luu lai lich su de frontend co the hien preview + theo doi phien ban.
-- ============================================================
CREATE TABLE website_qr_configs (
    config_id            VARCHAR(50)  PRIMARY KEY,
    website_url          VARCHAR(500) NOT NULL,
    compact_url          VARCHAR(255) NOT NULL,
    change_number        INT          NOT NULL,
    qr_file_name         VARCHAR(255) NOT NULL UNIQUE,
    qr_storage_path      VARCHAR(500) NOT NULL,
    qr_public_url        VARCHAR(500) NOT NULL,
    created_by_admin_id  VARCHAR(50)  NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_website_qr_change_number (change_number),
    FOREIGN KEY (created_by_admin_id) REFERENCES accounts(account_id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_session_set_expiry_on_insert;
DROP TRIGGER IF EXISTS trg_session_extend_expiry_on_update;

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

CREATE TRIGGER trg_session_extend_expiry_on_update
BEFORE UPDATE ON account_sessions
FOR EACH ROW
BEGIN
    IF NEW.last_active_at IS NULL THEN
        SET NEW.last_active_at = CURRENT_TIMESTAMP;
    END IF;

    IF NEW.last_active_at <> OLD.last_active_at THEN
        SET NEW.expires_at = DATE_ADD(NEW.last_active_at, INTERVAL 4 DAY);
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- PHẦN 9: INDEXING - TỐI ƯU HIỆU SUẤT
-- Triết lý: Index = "mục lục sách". Không cần lật từng trang.
-- Tạo index cho các cột thường xuyên xuất hiện trong WHERE / JOIN.
-- ============================================================

-- ── qr_codes ────────────────────────────────────────────────
-- [GHI CHÚ] qr_public_token đã có UNIQUE constraint → MySQL đã tự tạo index ngầm.
-- CREATE UNIQUE INDEX idx_qr_public_token ON qr_codes(qr_public_token); -- ĐÃ COMMENT: redundant với UNIQUE constraint

-- Giúp lọc nhanh các mã theo trạng thái (ví dụ: đếm bao nhiêu mã SUSPICIOUS trong lô X)
CREATE INDEX idx_qr_status              ON qr_codes(status);
-- Giúp lấy nhanh toàn bộ mã QR thuộc một lô hàng cụ thể
CREATE INDEX idx_qr_batch_id            ON qr_codes(batch_id);
-- Giúp kiểm tra nhanh mã có đang trong thời hạn hiệu lực không
CREATE INDEX idx_qr_effective_expires   ON qr_codes(effective_from, expires_at);
-- ── scan_global_logs ─────────────────────────────────────────
-- Query phổ biến nhất: "Xem toàn bộ lịch sử quét của mã QR này theo thứ tự thời gian"
CREATE INDEX idx_log_qr_time            ON scan_global_logs(qr_id, scanned_at);
-- Giup truy vet nhanh lich su quet theo batch cho info QR va guest token
CREATE INDEX idx_log_batch_time         ON scan_global_logs(batch_id, scanned_at);
-- Lấy toàn bộ lịch sử quét của một tài khoản (trang quản lý cá nhân)
CREATE INDEX idx_log_account            ON scan_global_logs(account_id);

-- Truy vết: "Thiết bị này đã từng quét mã nào trước đó chưa?"
CREATE INDEX idx_log_fingerprint        ON scan_global_logs(fingerprint_id);

-- Báo cáo thống kê chống giả: lọc nhanh theo kết quả FAKE/SUSPICIOUS
CREATE INDEX idx_log_result             ON scan_global_logs(scan_result);

-- ── device_fingerprints ──────────────────────────────────────
-- [GHI CHÚ] fingerprint_hash đã có UNIQUE constraint → đã có index ngầm.
-- CREATE UNIQUE INDEX idx_fingerprint_hash ON device_fingerprints(fingerprint_hash); -- ĐÃ COMMENT: redundant

-- ── user_qr_collections ──────────────────────────────────────
-- Query phổ biến: "Lấy danh sách mã QR đang hiệu lực (chưa bị xóa) của user X"
CREATE INDEX idx_collection_user_active ON user_qr_collections(user_id, is_deleted_by_user);

CREATE INDEX idx_batch_qr_labels_batch_sequence
    ON batch_qr_labels(batch_id, sequence_no);

CREATE INDEX idx_batch_qr_labels_qr_id
    ON batch_qr_labels(qr_id);


CREATE INDEX idx_batch_qr_label_assets_label_type
ON batch_qr_label_assets(label_id, asset_type);

-- ── guest_scan_tokens ───────────────────────────────────────
CREATE INDEX idx_guest_token_qr         ON guest_scan_tokens(qr_id);
CREATE INDEX idx_guest_token_batch      ON guest_scan_tokens(batch_id);
CREATE INDEX idx_guest_token_claimed    ON guest_scan_tokens(claimed_by_user_id, claimed_at);

-- ── approval_requests ────────────────────────────────────────
-- Giúp Brand/Admin lọc nhanh: "Có yêu cầu đang PENDING cho sản phẩm này không?"
CREATE INDEX idx_approval_target        ON approval_requests(target_table, target_id, status);

-- ── qr_pin_activations ───────────────────────────────────────
-- Tra cứu nhanh: "Fingerprint này đã kích hoạt những mã QR nào?"
CREATE INDEX idx_activation_fingerprint ON qr_pin_activations(activated_by_fingerprint_id);

-- ── account_sessions ─────────────────────────────────────────
-- [GHI CHÚ] token_hash đã có UNIQUE constraint → đã có index ngầm.
-- CREATE UNIQUE INDEX idx_session_token_hash ON account_sessions(token_hash); -- ĐÃ COMMENT: redundant

-- Index để truy vấn "tất cả phiên đang sống của tài khoản X" (trang quản lý thiết bị)
CREATE INDEX idx_session_account_active ON account_sessions(account_id, is_revoked, expires_at);

-- Index giúp Event Scheduler dọn dẹp các token hết hạn nhanh hơn nhiều (quét theo expires_at)
CREATE INDEX idx_session_expires        ON account_sessions(expires_at);

-- ── brand_verification_requests ──────────────────────────────
-- Lấy nhanh toàn bộ lịch sử xét duyệt của 1 brand theo timeline
CREATE INDEX idx_verification_brand_time ON brand_verification_requests(brand_id, created_at);

-- Admin lọc nhanh: "Có bao nhiêu hồ sơ đang ở trạng thái SUBMITTED/RESUBMITTED?"
CREATE INDEX idx_verification_action    ON brand_verification_requests(action, created_at);

-- ── brand_registration_requests ──────────────────────────────
CREATE INDEX idx_brand_registration_status_created
ON brand_registration_requests(request_status, created_at);

CREATE INDEX idx_brand_registration_email
ON brand_registration_requests(email);

CREATE INDEX idx_brand_registration_phone
ON brand_registration_requests(phone);

CREATE INDEX idx_brand_registration_tax_id
ON brand_registration_requests(tax_id);

CREATE INDEX idx_pictures_group_status_created
ON pictures(picture_group, processing_status, created_at);

CREATE INDEX idx_pictures_source_created
ON pictures(capture_source, created_at);

CREATE INDEX idx_website_qr_created_at
ON website_qr_configs(created_at);

-- ============================================================
-- PATCH v2.4: FORGOT PASSWORD OTP + RESET TOKEN
-- Muc dich: doi cot reset_otp thanh hash va them reset token tam
-- de luong quen mat khau an toan hon cho backend.
-- ============================================================
ALTER TABLE accounts
  CHANGE COLUMN reset_otp reset_otp_hash VARCHAR(255) NULL,
  MODIFY COLUMN otp_expiry DATETIME NULL,
  ADD COLUMN reset_token_hash VARCHAR(255) NULL AFTER otp_expiry,
  ADD COLUMN reset_token_expiry DATETIME NULL AFTER reset_token_hash;

-- ============================================================
-- END OF SCRIPT
-- ============================================================



