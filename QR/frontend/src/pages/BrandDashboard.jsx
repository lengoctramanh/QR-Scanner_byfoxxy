import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  QrCode,
  Menu,
  Building,
  Package,
  CheckCircle,
  Settings,
  Camera,
  MapPin,
  Globe,
  Mail,
  Eye,
  EyeOff,
  PlusCircle,
  FileSpreadsheet,
  UploadCloud,
  X,
} from "lucide-react";
import "../assets/style.css";
import "./BrandDashboard.css";
import "./UserDashboard.css";

export default function BrandDashboard() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const navigate = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token) {
      navigate("/login");
    } else if (role !== "brand") {
      if (role === "supplier") navigate("/supplier-profile");
      else navigate("/profile");
    }
  }, [navigate]);

  const logoInputRef = useRef(null);
  const excelInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [excelFile, setExcelFile] = useState(null);

  const [brandInfo, setBrandInfo] = useState({
    fullName: "Name",
    businessName: "Acme Corporation",
    taxId: "0123456789",
    email: "contact@acme.com",
    address: "123 Tech Valley, Silicon City",
    website: "https://acmecorp.com",
    logo: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png",
  });

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [qrForm, setQrForm] = useState({
    productName: "",
    qrCodeString: "",
    scanLimit: 5,
    isSystemGenerated: false,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleExcelDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.name.endsWith(".xls") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".csv"))
    ) {
      setExcelFile(file);
    } else {
      alert("Vui lòng tải lên file Excel hợp lệ (.xls, .xlsx, .csv)");
    }
  };

  const handleExcelChange = (e) => {
    const file = e.target.files[0];
    if (file) setExcelFile(file);
  };

  const submitManualQR = (e) => {
    e.preventDefault();
    console.log("Dữ liệu nộp lên Backend:", qrForm);
    alert("Đã tạo mã QR thành công!");
    setQrForm({ ...qrForm, productName: "", qrCodeString: "" });
  };

  const submitExcelQR = () => {
    if (!excelFile) return alert("Vui lòng chọn file Excel!");
    alert(
      `Đã nộp lô sản phẩm từ file: ${excelFile.name}. Hệ thống đang xử lý...`,
    );
    setExcelFile(null);
  };

  return (
    <div className="page-container">
      <div className="main-panel">
        <header className="top-bar">
          <div className="logo-area">
            <QrCode className="qr-svg text-white" />
            <Link to="/" style={{ textDecoration: "none" }}>
              <span className="logo-text text-white ms-2">QR CODE</span>
            </Link>
          </div>
          <div className="menu-area">
            <button className="menu-btn" onClick={() => setOpen(!open)}>
              <Menu className="menu-svg" color="white" />
            </button>
            <div className={`dropdown-menu ${open ? "show" : ""}`}>
              <Link to="/">Trang chủ</Link>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ff4d4d",
                  padding: "12px 18px",
                  width: "100%",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-layout">
            <aside className="brand-sidebar">
              <div className="brand-logo-wrapper">
                <img
                  src={brandInfo.logo}
                  alt="Brand Logo"
                  className="brand-logo-img"
                />
                <button
                  className="upload-avatar-btn"
                  onClick={() => logoInputRef.current.click()}
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={logoInputRef}
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    setBrandInfo({
                      ...brandInfo,
                      logo: URL.createObjectURL(e.target.files[0]),
                    })
                  }
                />
              </div>

              <div className="user-sidebar-info" style={{ width: "100%" }}>
                <h3 className="user-name" style={{ color: "#3f78c9" }}>
                  {brandInfo.fullName}
                </h3>
                <h3 className="user-name" style={{ color: "#3f78c9" }}>
                  {brandInfo.businessName}
                </h3>
                <p className="user-username" style={{ textAlign: "center" }}>
                  Mã số thuế: {brandInfo.taxId}
                </p>

                <div className="user-info-list">
                  <div className="info-item">
                    <Mail size={16} className="icon" /> {brandInfo.email}
                  </div>
                  <div className="info-item">
                    <MapPin size={16} className="icon" /> {brandInfo.address}
                  </div>
                  <div className="info-item">
                    <Globe size={16} className="icon" />{" "}
                    <a
                      href={brandInfo.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#475569" }}
                    >
                      {brandInfo.website}
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            <section className="dashboard-content">
              <div className="tab-nav">
                <button
                  className={`tab-btn ${activeTab === "manage" ? "active" : ""}`}
                  onClick={() => setActiveTab("manage")}
                >
                  <Package size={18} /> Quản lý Sản phẩm
                </button>
                <button
                  className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
                  onClick={() => setActiveTab("create")}
                >
                  <PlusCircle size={18} /> Cấp phát QR
                </button>
                <button
                  className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings size={18} /> Cài đặt
                </button>
              </div>

              <div className="tab-body">
                {activeTab === "manage" && (
                  <div>
                    <h3 style={{ color: "#3f78c9", marginTop: 0 }}>
                      Danh sách mã QR đã phát hành
                    </h3>
                    <p style={{ color: "#64748b" }}>
                      Tính năng xem danh sách và biểu đồ thống kê đang được hoàn
                      thiện...
                    </p>
                  </div>
                )}

                {activeTab === "create" && (
                  <div className="qr-creation-grid">
                    <div className="creation-section">
                      <h4 className="section-title">
                        <Package size={20} color="#3f78c9" /> Nhập lẻ sản phẩm
                      </h4>
                      <form onSubmit={submitManualQR}>
                        <div
                          className="input-group"
                          style={{ marginBottom: "15px" }}
                        >
                          <label>Tên sản phẩm *</label>
                          <input
                            type="text"
                            required
                            placeholder="VD: Sữa rửa mặt ABC"
                            value={qrForm.productName}
                            onChange={(e) =>
                              setQrForm({
                                ...qrForm,
                                productName: e.target.value,
                              })
                            }
                            className="input-wrap"
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                            marginBottom: "15px",
                            background: "#f8fbff",
                            padding: "12px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={qrForm.isSystemGenerated}
                              onChange={(e) =>
                                setQrForm({
                                  ...qrForm,
                                  isSystemGenerated: e.target.checked,
                                  qrCodeString: "",
                                })
                              }
                            />
                            <span className="slider"></span>
                          </label>
                          <div>
                            <span
                              style={{
                                fontWeight: 700,
                                color: "#1e293b",
                                display: "block",
                                fontSize: "14px",
                              }}
                            >
                              Hệ thống tự động sinh mã
                            </span>
                            <span
                              style={{ fontSize: "12px", color: "#64748b" }}
                            >
                              Mã ngẫu nhiên, bảo mật cao chống đoán mò.
                            </span>
                          </div>
                        </div>

                        {!qrForm.isSystemGenerated && (
                          <div
                            className="input-group"
                            style={{ marginBottom: "15px" }}
                          >
                            <label>Dữ liệu / Chuỗi mã QR riêng của bạn *</label>
                            <input
                              type="text"
                              required
                              placeholder="VD: THUONGHIEU-SP1-001"
                              value={qrForm.qrCodeString}
                              onChange={(e) =>
                                setQrForm({
                                  ...qrForm,
                                  qrCodeString: e.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                              }}
                            />
                          </div>
                        )}

                        <div
                          className="input-group"
                          style={{ marginBottom: "20px" }}
                        >
                          <label>Giới hạn số lần quét cảnh báo</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={qrForm.scanLimit}
                            onChange={(e) =>
                              setQrForm({
                                ...qrForm,
                                scanLimit: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          className="save-btn"
                          style={{ width: "100%" }}
                        >
                          TẠO MÃ QR
                        </button>
                      </form>
                    </div>

                    <div className="creation-section">
                      <h4 className="section-title">
                        <FileSpreadsheet size={20} color="#10b981" /> Đăng ký
                        theo lô (Excel)
                      </h4>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          marginBottom: "20px",
                        }}
                      >
                        Sử dụng file mẫu (.xlsx, .csv) chứa danh sách hàng ngàn
                        sản phẩm và mã QR tương ứng để hệ thống đồng bộ tự động.
                      </p>

                      <input
                        type="file"
                        accept=".xls,.xlsx,.csv"
                        ref={excelInputRef}
                        style={{ display: "none" }}
                        onChange={handleExcelChange}
                      />

                      {!excelFile ? (
                        <div
                          className={`excel-upload-zone ${isDragging ? "dragging" : ""}`}
                          onClick={() => excelInputRef.current.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleExcelDrop}
                        >
                          <UploadCloud size={36} />
                          <span>
                            Kéo thả file Excel vào đây hoặc Nhấn để chọn
                          </span>
                          <small>Hỗ trợ: .xls, .xlsx, .csv</small>
                        </div>
                      ) : (
                        <div
                          className="file-selected-box"
                          style={{
                            borderColor: "#10b981",
                            background: "#f0fdf4",
                            padding: "15px",
                          }}
                        >
                          <div className="file-info">
                            <FileSpreadsheet
                              size={20}
                              color="#10b981"
                              className="file-icon"
                            />
                            <span
                              className="file-name"
                              style={{ color: "#059669", fontWeight: 700 }}
                            >
                              {excelFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => setExcelFile(null)}
                          >
                            <X size={20} />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={submitExcelQR}
                        className="save-btn"
                        disabled={!excelFile}
                        style={{
                          width: "100%",
                          marginTop: "20px",
                          background: excelFile
                            ? "linear-gradient(180deg, #34d399 0%, #10b981 100%)"
                            : "#cbd5e1",
                          boxShadow: "none",
                        }}
                      >
                        TẢI LÊN VÀ XỬ LÝ LÔ
                      </button>

                      <div style={{ textAlign: "center", marginTop: "15px" }}>
                        <a
                          href="#"
                          style={{
                            color: "#3f78c9",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "underline",
                          }}
                        >
                          Tải xuống File Excel Mẫu
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <form className="settings-form" style={{ maxWidth: "100%" }}>
                    <div className="settings-group">
                      <h4>
                        <Building size={18} /> Hồ sơ Doanh nghiệp
                      </h4>
                      <div
                        className="input-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "15px",
                        }}
                      >
                        <div className="input-group">
                          <label>Tên Doanh nghiệp</label>
                          <input
                            type="text"
                            value={brandInfo.businessName}
                            onChange={(e) =>
                              setBrandInfo({
                                ...brandInfo,
                                businessName: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                            }}
                          />
                        </div>
                        <div className="input-group">
                          <label>Email Liên hệ</label>
                          <input
                            type="email"
                            value={brandInfo.email}
                            onChange={(e) =>
                              setBrandInfo({
                                ...brandInfo,
                                email: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                            }}
                          />
                        </div>
                        <div
                          className="input-group"
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <label>Địa chỉ Trụ sở</label>
                          <input
                            type="text"
                            value={brandInfo.address}
                            onChange={(e) =>
                              setBrandInfo({
                                ...brandInfo,
                                address: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "12px",
                              borderRadius: "10px",
                              border: "1px solid #cbd5e1",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="settings-group">
                      <h4>
                        <Settings size={18} /> Đổi Mật Khẩu
                      </h4>
                      <div
                        className="input-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "15px",
                        }}
                      >
                        <div className="input-group pw-input-wrap">
                          <label>Mật khẩu mới</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showPw.new ? "text" : "password"}
                              placeholder="••••••••"
                              value={passwords.new}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  new: e.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                              }}
                            />
                            <button
                              type="button"
                              className="toggle-pw-btn"
                              onClick={() =>
                                setShowPw({ ...showPw, new: !showPw.new })
                              }
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "10px",
                                background: "none",
                                border: "none",
                                color: "#94a3b8",
                              }}
                            >
                              {showPw.new ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="input-group pw-input-wrap">
                          <label>Xác nhận mật khẩu</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showPw.confirm ? "text" : "password"}
                              placeholder="••••••••"
                              value={passwords.confirm}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  confirm: e.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                              }}
                            />
                            <button
                              type="button"
                              className="toggle-pw-btn"
                              onClick={() =>
                                setShowPw({
                                  ...showPw,
                                  confirm: !showPw.confirm,
                                })
                              }
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "10px",
                                background: "none",
                                border: "none",
                                color: "#94a3b8",
                              }}
                            >
                              {showPw.confirm ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="save-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Đã lưu!");
                      }}
                    >
                      LƯU THAY ĐỔI
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
