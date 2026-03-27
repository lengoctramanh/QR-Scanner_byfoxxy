# BAO CAO CHI TIET HE THONG CHONG HANG GIA BANG MA QR

## 1. Gioi thieu de tai

De tai "Xay dung he thong chong hang gia bang ma QR" huong toi bai toan xac thuc san pham, ho tro doanh nghiep cap phat ma QR cho tung don vi hang hoa va cho phep nguoi dung kiem tra tinh chinh hang thong qua quet QR. He thong duoc xay dung theo mo hinh web full-stack, trong do frontend dam nhiem giao dien va trai nghiem nguoi dung, backend dam nhiem xu ly nghiep vu, quan ly phien dang nhap, luu tru du lieu va xu ly quet QR.

Du an hien tai khong chi dung lai o viec quet ma QR thong thuong, ma da mo rong thanh mot he thong co phan quyen theo vai tro, gom:

- Nguoi dung thuong (`user`): dang ky, dang nhap, xem thong tin ca nhan.
- Doanh nghiep/thuong hieu (`brand`): nop ho so dang ky doanh nghiep de admin duyet.
- Quan tri vien (`admin`): xem va xu ly cac ho so dang ky brand.

Ngoai ra, he thong con bo sung luong xu ly anh QR dau vao bang Python/OpenCV, giup ho tro tien xu ly anh chup tu camera hoac thu vien anh truoc khi dua vao buoc giai ma va xac thuc.

## 2. Muc tieu he thong

He thong duoc xay dung voi cac muc tieu chinh sau:

- Cung cap kenh xac thuc san pham bang ma QR cho nguoi dung.
- Ho tro doanh nghiep dang ky tai khoan va duoc admin phe duyet truoc khi su dung he thong.
- Quan ly phien dang nhap an toan bang session token luu hash trong CSDL.
- Tach biet hai cap do quet QR:
  - `public scan`: quet ma cong khai ben ngoai.
  - `secret scan`: quet ma bi mat sau khi boc tem de xac nhan hang chinh hang.
- Ghi nhan lich su quet va phat hien cac tinh huong bat thuong nhu quet lai tren thiet bi khac, ma gia, ma bi khoa, ma het han.
- Ho tro quy trinh xu ly anh QR tu camera/thu vien bang worker nen va Python processor.

## 3. Cong nghe su dung

### 3.1 Frontend

- React 19
- Vite 7
- React Router DOM 7
- Axios
- Lucide React
- jsQR

Frontend duoc to chuc theo huong tach `pages`, `hooks`, `services`, `api`, `components`, giup de mo rong va bao tri.

### 3.2 Backend

- Node.js
- Express 5
- MySQL 8 voi `mysql2`
- Multer de xu ly upload tep
- bcryptjs de bam mat khau va secret PIN
- uuid de sinh ID
- qrcode cho cac chuc nang lien quan ma QR

Backend duoc to chuc theo mo hinh nhieu lop:

- `routes`: khai bao endpoint
- `controllers`: tiep nhan request/response
- `services`: xu ly nghiep vu
- `models`: truy van CSDL
- `middlewares`: xac thuc, phan quyen
- `utils` va `app`: ham ho tro va xu ly QR

### 3.3 Xu ly anh QR

- Python
- OpenCV (`cv2`)
- NumPy

Python script `process_qr_image.py` co vai tro:

- Phat hien QR trong anh
- Uu tien dung WeChat QR detector neu du model
- Tu dong fallback sang `cv2.QRCodeDetector` neu can
- Cat rieng vung QR
- Chinh phoi canh
- Lam sach, nhi phan hoa, resize va luu anh da xu ly

## 4. Kien truc tong the he thong

He thong duoc trien khai theo kien truc client-server:

1. Frontend React gui request HTTP toi backend thong qua cac service su dung Axios.
2. Backend Express tiep nhan request, chuyen vao controller.
3. Controller trich xuat du lieu va goi service nghiep vu.
4. Service thao tac voi model de doc/ghi CSDL MySQL.
5. Neu request lien quan den anh QR, backend luu anh vao thu muc `QRScan`, tao ban ghi trong bang `pictures`, sau do kich hoat worker nen.
6. Worker nen goi script Python de xu ly anh va cap nhat ket qua vao bang `pictures`.

Luot di du lieu nay giup he thong tach ro:

- lop giao dien,
- lop nghiep vu,
- lop du lieu,
- lop xu ly anh chuyen biet.

## 5. Chuc nang backend

### 5.1 Khoi dong he thong va middleware

File `server.js` thuc hien:

- Khoi tao Express app
- Cau hinh `cors()`
- Cau hinh `express.json()`
- Gan cac route:
  - `/api/auth`
  - `/api/admin`
  - `/api/scan`
- Public static file cho:
  - `/pictures`
  - `/QRScan`
  - `/ProcessedQRScan`
- Khoi dong worker xu ly QR nen bang `startQrProcessingWorker()`

### 5.2 Dang ky tai khoan

Backend ho tro hai hinh thuc dang ky:

#### a. Dang ky nguoi dung thuong

Khi role la `user`, controller `authRegister` goi `accountService.createUserAccount()`:

- Chuan hoa email hoac so dien thoai
- Tao `account_id`
- Bam mat khau voi `passwordUtil`
- Tao ban ghi trong bang `accounts`
- Tao profile trong bang `users`
- Transaction dam bao tinh toan ven du lieu

Tai khoan user sau khi tao duoc dat trang thai `active`.

#### b. Dang ky doanh nghiep/thuong hieu

Khi role la `brand`, controller goi `brandRegistrationRequestService.submitRequest()`:

- Kiem tra trung email/so dien thoai
- Kiem tra trung ma so thue
- Kiem tra xem da co request pending trung lap hay chua
- Tao `request_id`, `reserved_account_id`, `reserved_brand_id`
- Bam mat khau
- Luu tep dinh kem ho so doanh nghiep
- Ghi vao bang `brand_registration_requests`

Day la diem nang cap quan trong cua he thong: doanh nghiep khong duoc tao account ngay, ma phai qua buoc admin duyet.

### 5.3 Dang nhap va quan ly phien

Dang nhap duoc xu ly trong `authService.login()`:

- Cho phep dang nhap bang email hoac so dien thoai
- Kiem tra password bang bcrypt
- Chan tai khoan `banned`
- Kiem tra rieng tai khoan admin phai o trang thai `active`
- Tao raw token ngau nhien
- Bam token bang SHA-256 truoc khi luu CSDL
- Tao session moi trong bang `account_sessions`
- Cap nhat `last_login_at`

Du lieu session gom:

- `session_id`
- `account_id`
- `token_hash`
- `device_info`
- `device_type`
- `ip_at_login`
- `location_at_login`
- `last_active_at`
- `expires_at`

Session co co che song truot 4 ngay. Moi lan API hop le duoc goi, middleware `requireAuth` cap nhat `last_active_at`.

### 5.4 Xac thuc va phan quyen

Middleware `authMiddleware.js` dam nhan:

- Tach Bearer token tu header `Authorization`
- Bam token bang SHA-256
- Tim session con hieu luc trong DB
- Nap `req.auth` va `req.account`
- Chan tai khoan da bi khoa
- Phan quyen bang `requireRole("admin")` hoac role khac

Nho do, he thong dam bao cac route nhay cam chi duoc truy cap boi dung vai tro.

### 5.5 Lay thong tin nguoi dung hien tai

Endpoint `/api/auth/me` cho phep frontend lay profile hien tai sau khi dang nhap. Backend tra ve:

- thong tin account
- vai tro
- trang thai
- avatar
- thong tin brand neu role la `brand`

API nay duoc frontend dung de hien thi dashboard, sidebar va kiem tra role.

### 5.6 Quy trinh duyet dang ky brand

Admin duoc cap cac endpoint:

- `GET /api/admin/brand-registration-requests`
- `GET /api/admin/brand-registration-requests/:requestId`
- `POST /api/admin/brand-registration-requests/:requestId/create-account`
- `POST /api/admin/brand-registration-requests/:requestId/reject`

Nghiep vu duyet brand gom:

#### a. Xem danh sach ho so

Service `listRequests()` doc du lieu tu bang `brand_registration_requests`, chuan hoa lai du lieu va tra ve cho dashboard admin.

#### b. Xem chi tiet ho so

Admin co the mo modal xem chi tiet:

- thong tin ca nhan nguoi dang ky
- thong tin thuong hieu
- ma so thue
- ghi chu
- tep dinh kem

#### c. Phe duyet va tao tai khoan that

Khi admin chap nhan:

- Tao ban ghi trong `accounts` voi role `brand`
- Tao ban ghi trong `brands`
- Danh dau request thanh `ACCOUNT_CREATED`
- Gan `reviewed_by_admin_id`

#### d. Tu choi

Neu tu choi:

- Cap nhat trang thai request thanh `REJECTED`
- Luu `admin_note`

Quy trinh nay giup tang tinh kiem soat va phu hop voi bai toan doanh nghiep can xac minh truoc khi tham gia he thong.

### 5.7 Quet QR cong khai

Endpoint `GET /api/scan/public/:token` xu ly public scan.

Nghiep vu trong `scanService.handlePublicScan()`:

- Kiem tra token hop le
- Tim QR theo `qr_public_token`
- Neu khong tim thay:
  - ghi log `FAKE`
  - tra ve canh bao hang gia
- Neu tim thay:
  - ghi log public scan
  - danh gia theo trang thai QR

Ket qua co the la:

- `INTACT`: san pham con nguyen ven, chua kich hoat
- `SUSPICIOUS`: da co dau hieu bat thuong
- `BLOCKED`: ma bi khoa
- `EXPIRED`: ma het han

Public scan khong xac nhan 100% hang that, ma dong vai tro canh bao ban dau va hien thong tin chung cua san pham.

### 5.8 Quet QR bi mat

Endpoint `POST /api/scan/secret` xu ly secret scan.

Secret token co dinh dang:

`QRS.v1.<publicToken>.<secretValue>`

Nghiep vu `handleSecretScan()` gom:

- Phan tich secret token bang `qrEngine.parseSecretToken()`
- Bam `secretValue` de phuc vu ghi log
- Mo transaction
- Tim QR theo `publicToken`
- Kiem tra cac trang thai dac biet:
  - `BLOCKED`
  - `EXPIRED`
- So sanh `secretValue` voi `hidden_pin_hash` bang bcrypt

Neu dung va QR dang `NEW`:

- Tao ban ghi kich hoat trong `qr_pin_activations`
- Ghi log `VALID`
- Chuyen ma sang trang thai kich hoat
- Tra ve ket luan `GENUINE`

Neu QR da `ACTIVATED`:

- Neu cung actor kich hoat truoc do thi xem la quet lai hop le
- Neu khac actor/thiet bi thi danh dau `SUSPICIOUS`

Co che nay giup he thong khong chi phan biet that/gia, ma con phat hien nguy co sao chep tem.

### 5.9 Tien xu ly anh QR

Endpoint `POST /api/scan/preprocess-image` nhan anh tu frontend.

Service `preprocessImage()` thuc hien:

- Kiem tra tep co phai anh hay khong
- Luu anh goc vao `app/QRScan`
- Tao duong dan file output trong `app/ProcessedQRScan`
- Ghi metadata vao bang `pictures`
- Danh dau `processing_status = PENDING`
- Kich hoat worker nen

Worker `qrProcessingWorker.js`:

- Poll DB moi 3 giay
- Lay toi da 3 anh `PENDING`
- Danh dau `PROCESSING`
- Goi script Python
- Neu thanh cong:
  - luu anh da xu ly
  - cap nhat `PROCESSED`
- Neu that bai:
  - cap nhat `FAILED`

### 5.10 Sinh du lieu QR

Module `qrEngine.js` phuc vu sinh cap QR:

- Tao `publicToken`
- Tao `secretValue`
- Ghep thanh `secretToken`
- Bam `secretValue` thanh `hiddenPinHash`
- Tao payload bulk insert vao CSDL
- Tao du lieu in an/xuat file

He thong dam bao:

- khong trung `publicToken`
- khong trung `secretToken`
- co the sinh so luong lon theo co che concurrency

Day la nen tang quan trong de phat trien chuc nang cap phat QR hang loat cho doanh nghiep.

## 6. Co so du lieu

Du an co hai script SQL chinh:

- `ScriptDB1.sql`: phien ban so khai, mo ta co so du lieu nen tang.
- `ScriptDB2.sql`: phien ban mo rong, phan anh sat hon voi code hien tai.

### 6.1 Cac bang trong tam

#### a. Quan ly tai khoan

- `accounts`
- `users`
- `brands`
- `account_sessions`

#### b. Dang ky va xac minh doanh nghiep

- `brand_registration_requests`
- `brand_verification_requests`

#### c. San pham va lo hang

- `products`
- `batches`

#### d. Ma QR va kich hoat

- `qr_codes`
- `qr_pin_activations`
- `qr_code_requests`

#### e. Lich su va phan tich

- `scan_global_logs`
- `user_scan_history`
- `user_qr_collections`

#### f. Xu ly anh

- `pictures`

### 6.2 Dac diem thiet ke du lieu

- Dung UUID thay vi auto-increment de tranh lo ID
- Tach `accounts` va profile role (`users`, `brands`)
- Luu `token_hash` thay vi raw token
- Ghi log scan theo kieu append-only, han che sua xoa
- Them index cho cac truong truy van nhieu nham toi uu hieu nang

## 7. Chuc nang frontend

### 7.1 Cau truc frontend

Frontend React duoc chia thanh:

- `pages`: cac trang chinh
- `layouts`: khung giao dien cong khai va dashboard
- `hooks`: quan ly state va nghiep vu giao dien
- `services`: goi API
- `api`: dong goi endpoint axios
- `components`: thanh phan UI tai su dung
- `utils`: ham ho tro

### 7.2 Dieu huong va bo cuc

`App.jsx` khai bao hai nhom route:

#### PublicLayout

- `/`
- `/register`
- `/login`
- `/forgot-password`
- `/terms-of-service`
- `/privacy-policy`

#### DashboardLayout

- `/profile`
- `/brand-profile`
- `/admin-dashboard`

Kien truc nay giup tach biet giao dien cong khai va giao dien sau dang nhap.

### 7.3 Dang nhap

Trang `Login.jsx` cung cap:

- dang nhap bang email hoac so dien thoai
- hien/an mat khau
- thong bao loi/thanh cong
- dieu huong theo role sau dang nhap

Sau khi dang nhap thanh cong:

- token duoc luu vao `localStorage`
- role cung duoc luu vao `localStorage`
- axios tu dong gan header `Authorization: Bearer <token>`

### 7.4 Kiem tra dang nhap va role

Hook `useAuthCheck()` kiem tra:

- neu chua co token thi chuyen ve `/login`
- neu role khong hop le thi dieu huong ve dashboard dung vai tro

Day la lop bao ve giao dien phia frontend bo sung cho middleware backend.

### 7.5 Dang ky

Trang `Register.jsx` va hook `useRegisterForm()` ho tro:

- chon role `user` hoac `brand`
- nhap thong tin ca nhan
- nhap thong tin doanh nghiep neu dang ky brand
- upload tep dinh kem
- keo tha tep
- validate du lieu truoc khi gui

Neu dang ky brand, frontend gui `FormData` kem tep dinh kem den backend.

### 7.6 Trang Home va quy trinh quet QR

Trang `Home.jsx` la man hinh quet QR chinh, ho tro:

- mo camera
- chup anh tu camera
- chon anh tu gallery
- kiem tra nhanh anh co chua QR hay khong bang `jsQR`
- upload anh len backend de luu va tien xu ly

Luot xu ly phia frontend:

1. Nguoi dung mo camera hoac chon anh.
2. Frontend dung `jsQR` de kiem tra co QR trong anh.
3. Neu hop le, gui anh bang `FormData`.
4. Hien thong bao ket qua luu anh thanh cong.

Day la diem ket hop giua xu ly QR phia client va xu ly anh chuyen sau phia server.

### 7.7 Dashboard admin

`AdminDashboard` va `useAdminDashboard()` la khu vuc duoc noi backend tuong doi day du doi voi bai toan duyet brand.

Chuc nang chinh:

- tai profile admin tu `/auth/me`
- tai danh sach ho so dang ky brand tu API that
- xem chi tiet tung ho so
- phe duyet tao tai khoan brand
- tu choi ho so
- cap nhat banner hoat dong

Tuy nhien, mot so tab khac trong dashboard admin van dang dung du lieu mau (`mock data`), nhu:

- approval requests mo rong
- QR monitoring overview
- active sessions giao dien

Vi vay, bao cao can neu ro:

- phan duyet brand da co API that
- phan QR monitoring va system management moi o muc prototype giao dien

### 7.8 Dashboard brand

`BrandDashboard` hien tai co cac nhom chuc nang giao dien:

- thong tin thuong hieu
- doi avatar/logo tam thoi
- nhap form tao QR thu cong
- upload file Excel/CSV
- doi mat khau trong giao dien settings

Tuy nhien, phan lon thao tac hien dang o muc local state va `alert()`:

- tao QR thu cong chua goi backend that
- upload Excel chua day vao API xu ly
- luu settings chua ghi xuong CSDL

Noi cach khac, giao dien brand da duoc dung khung kha day du, nhung chua hoan tat noi backend.

### 7.9 Dashboard user

`UserDashboard` su dung `useUserDashboard()` de:

- kiem tra role
- tai profile hien tai
- hien lich su scan mau
- doi avatar tam thoi
- luu settings giao dien

Phan du lieu lich su scan va mot so thong tin van dang la du lieu khoi tao mau, chua noi day du voi backend scan history.

## 8. Quy trinh nghiep vu tieu bieu

### 8.1 Quy trinh dang ky brand

1. Nguoi dung chon role `brand` tai trang dang ky.
2. Nhap thong tin ca nhan, thong tin doanh nghiep, tep dinh kem.
3. Frontend gui `FormData` len backend.
4. Backend kiem tra trung lap.
5. Backend luu request vao `brand_registration_requests`.
6. Admin dang nhap dashboard va tai hang doi review.
7. Admin xem chi tiet ho so.
8. Admin chap nhan hoac tu choi.
9. Neu chap nhan, backend tao account brand that trong `accounts` va `brands`.

### 8.2 Quy trinh dang nhap

1. Nguoi dung nhap email/so dien thoai va mat khau.
2. Frontend goi API `/api/auth/login`.
3. Backend kiem tra password.
4. Backend tao session token moi.
5. Frontend luu token va role.
6. Nguoi dung duoc dieu huong den dashboard phu hop.

### 8.3 Quy trinh quet QR bang anh

1. Nguoi dung chup anh tu camera hoac chon anh san co.
2. Frontend dung `jsQR` de kiem tra QR.
3. Frontend gui anh den `/api/scan/preprocess-image`.
4. Backend luu anh vao `QRScan`.
5. Bang `pictures` ghi nhan job xu ly.
6. Worker goi Python script.
7. Python detect, crop, enhance QR va luu vao `ProcessedQRScan`.
8. Backend cap nhat trang thai `PROCESSED` hoac `FAILED`.

### 8.4 Quy trinh xac thuc QR

1. Nguoi dung quet ma public de xem thong tin tong quan.
2. He thong tra ve tinh trang ma.
3. Neu nguoi dung boc tem va nhap/quyet ma secret:
4. Backend xac minh `secretToken`.
5. Neu lan dau hop le thi danh dau hang that.
6. Neu da kich hoat ma quet tren actor khac thi danh dau nghi ngo.

## 9. Danh gia thuc trang he thong

### 9.1 Phan da hoan thien tuong doi tot

- Kien truc frontend/backend tach ro rang
- Dang ky user
- Dang ky brand qua luong cho duyet
- Dang nhap bang email hoac so dien thoai
- Quan ly session bang token hash
- Middleware xac thuc va phan quyen
- API lay profile hien tai
- Admin dashboard cho quy trinh duyet brand
- Upload anh QR va worker xu ly nen
- Python processor de detect va cat QR
- Logic public scan va secret scan co nghiep vu kha day du

### 9.2 Phan dang o muc prototype hoac chua noi day du

- Brand dashboard chua ket noi that cho tao QR, upload Excel, doi settings
- User dashboard chua noi that lich su scan va bo suu tap QR
- Admin dashboard van con mot so bang so lieu dung du lieu mau
- Chua thay toan bo luong cap phat QR tu brand request den sinh file xuat cho doanh nghiep trong frontend
- Chuc nang quen mat khau hien moi o muc thong bao OTP, chua co buoc xac thuc OTP va dat lai mat khau hoan chinh o backend

### 9.3 Diem manh ky thuat

- Dung transaction cho cac thao tac quan trong
- Luu token dang hash thay vi plain text
- Tach public scan va secret scan dung voi bai toan chong sao chep tem
- Co co che phat hien quet lai tren actor khac
- Xu ly anh tach rieng bang worker va Python, giup backend Node khong bi block

### 9.4 Han che hien tai

- Chua dong bo hoan toan giua giao dien va backend o tat ca dashboard
- Chua thay bo test tu dong
- Chua thay co che revoke session tu frontend
- Chua thay module bao cao thong ke that tu scan logs tren giao dien

## 10. Huong phat trien

De hoan thien he thong thanh san pham co the trien khai thuc te, nhom co the tiep tuc:

- Noi that chuc nang tao QR trong dashboard brand voi `qrEngine`
- Bo sung API upload Excel va cap phat QR hang loat
- Xay dung trang ket qua xac thuc QR hoan chinh cho nguoi dung cuoi
- Noi du lieu that cho dashboard user: lich su scan, bo suu tap, soft-delete
- Noi du lieu that cho dashboard admin: session, monitoring, thong ke QR bat thuong
- Hoan tat luong OTP reset password
- Bo sung logging, test, va phan quyen chi tiet hon
- Trien khai file xuat QR de doanh nghiep tai ve phuc vu in tem

## 11. Ket luan

Du an da xay dung duoc nen tang kha ro rang cho he thong chong hang gia bang ma QR. Diem noi bat cua he thong nam o viec ket hop:

- quan ly tai khoan theo vai tro,
- quy trinh duyet doanh nghiep,
- quan ly session an toan,
- xu ly anh QR bang Python/OpenCV,
- va nghiep vu xac thuc QR hai lop public/secret.

So voi mot ung dung quet QR thong thuong, he thong nay da bat dau tiep can dung dac thu cua bai toan chong hang gia, dac biet o co che secret token va phat hien quet bat thuong theo actor/thiet bi. Tuy nhien, de dat muc do hoan thien cao hon, can tiep tuc dong bo frontend voi backend, bo sung dashboard du lieu that va hoan tat cac module dang o muc prototype.

Noi chung, day la mot huong xay dung dung dan, co co so ky thuat tot va co kha nang phat trien thanh he thong xac thuc san pham hoan chinh trong giai doan tiep theo.
