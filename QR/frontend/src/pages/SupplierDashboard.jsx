import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  QrCode,
  Menu,
  Truck,
  Package,
  Settings,
  Camera,
  MapPin,
  Mail,
  Eye,
  EyeOff,
  Boxes,
  ScanLine,
  Activity,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import "../assets/style.css";
import "./UserDashboard.css";
import "./SupplierDashboard.css";

export default function SupplierDashboard() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const navigate = useNavigate();

  // ĐÃ DI CHUYỂN USEEFFECT VÀO BÊN TRONG HÀM NÀY
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    // Nếu chưa đăng nhập -> đuổi ra Login
    if (!token) {
      navigate("/login");
    }
    // Nếu đăng nhập rồi mà không phải supplier -> đuổi về đúng nhà
    else if (role !== "supplier") {
      if (role === "brand") navigate("/brand-profile");
      else navigate("/profile");
    }
  }, [navigate]);

  const logoInputRef = useRef(null);

  const [supplierInfo, setSupplierInfo] = useState({
    entityName: "NPP Logistics Toàn Cầu",
    email: "contact@global-logistics.com",
    region: "Miền Nam, Việt Nam",
    type: "Registered Company",
    services: "Vận chuyển, Lưu kho",
    logo: "https://cdn-icons-png.flaticon.com/512/2760/2760170.png",
  });

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState(null);

  const [inventory, setInventory] = useState([
    {
      id: "inv-1",
      qr_id: "THUONGHIEU-SP1-001",
      productName: "Giày Nike Air Max 97",
      brandName: "Nike VN",
      status: "instock",
      date: "2026-03-08 10:00",
    },
    {
      id: "inv-2",
      qr_id: "THUONGHIEU-SP2-099",
      productName: "Sữa rửa mặt ABC",
      brandName: "Acme Corp",
      status: "pending",
      date: "2026-03-09 (Dự kiến)",
    },
    {
      id: "inv-3",
      qr_id: "THUONGHIEU-SP1-002",
      productName: "Giày Nike Air Max 97",
      brandName: "Nike VN",
      status: "distributed",
      date: "2026-03-05 15:30",
    },
  ]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleScanSuccess = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const code = detectedCodes[0].rawValue;
      setIsScanning(false);
      setLastScannedCode(code);

      const newItem = {
        id: `inv-${Date.now()}`,
        qr_id: code,
        productName: "Sản phẩm vừa quét",
        brandName: "Đang xác định...",
        status: "instock",
        date: new Date().toLocaleString(),
      };
      setInventory([newItem, ...inventory]);
    }
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
            <aside className="supplier-sidebar">
              <div className="avatar-wrapper">
                <img
                  src={supplierInfo.logo}
                  alt="Logo"
                  className="avatar-img"
                  style={{ borderRadius: "16px" }}
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
                    setSupplierInfo({
                      ...supplierInfo,
                      logo: URL.createObjectURL(e.target.files[0]),
                    })
                  }
                />
              </div>

              <div className="user-sidebar-info" style={{ width: "100%" }}>
                <h3 className="user-name" style={{ color: "#d97706" }}>
                  {supplierInfo.entityName}
                </h3>
                <p className="user-username" style={{ textAlign: "center" }}>
                  <Building2 size={14} /> {supplierInfo.type}
                </p>

                <div className="user-info-list">
                  <div className="info-item">
                    <Mail
                      size={16}
                      className="icon"
                      style={{ color: "#d97706" }}
                    />{" "}
                    {supplierInfo.email}
                  </div>
                  <div className="info-item">
                    <MapPin
                      size={16}
                      className="icon"
                      style={{ color: "#d97706" }}
                    />{" "}
                    {supplierInfo.region}
                  </div>
                  <div className="info-item">
                    <Truck
                      size={16}
                      className="icon"
                      style={{ color: "#d97706" }}
                    />{" "}
                    {supplierInfo.services}
                  </div>
                </div>
              </div>
            </aside>

            <section className="dashboard-content">
              <div className="tab-nav">
                <button
                  className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
                  onClick={() => setActiveTab("inventory")}
                >
                  <Boxes size={18} /> Kho Lô Hàng
                </button>
                <button
                  className={`tab-btn ${activeTab === "scanner" ? "active" : ""}`}
                  onClick={() => setActiveTab("scanner")}
                >
                  <ScanLine size={18} /> Quét Nhập Kho
                </button>
                <button
                  className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings size={18} /> Cài đặt
                </button>
              </div>

              <div className="tab-body">
                {activeTab === "inventory" && (
                  <div className="scan-grid">
                    {inventory.map((item) => (
                      <div key={item.id} className="scan-card">
                        <div className="scan-header">
                          <span className={`status-badge ${item.status}`}>
                            {item.status === "pending"
                              ? "Đang giao tới"
                              : item.status === "instock"
                                ? "Trong kho"
                                : "Đã phân phối"}
                          </span>
                          <QrCode size={24} color="#94a3b8" />
                        </div>
                        <div className="scan-info">
                          <h4 style={{ fontSize: "15px" }}>
                            <Package
                              size={16}
                              style={{
                                verticalAlign: "middle",
                                marginRight: "5px",
                              }}
                            />{" "}
                            {item.productName}
                          </h4>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              margin: "5px 0",
                            }}
                          >
                            <Building2 size={12} /> Brand: {item.brandName}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              margin: 0,
                            }}
                          >
                            Mã: {item.qr_id}
                          </p>
                        </div>
                        <div
                          className="scan-actions"
                          style={{ marginTop: "10px", paddingTop: "10px" }}
                        >
                          <span
                            className="scan-count"
                            style={{ textDecoration: "none" }}
                          >
                            <Activity size={14} /> Cập nhật: {item.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "scanner" && (
                  <div className="warehouse-scanner-container">
                    <h3 style={{ color: "#1e293b", margin: 0 }}>
                      Trạm Kiểm Kê & Nhập Kho
                    </h3>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        margin: "0 0 10px",
                      }}
                    >
                      Đưa mã QR của sản phẩm vào khung hình để tự động cập nhật
                      trạng thái "Trong kho".
                    </p>

                    {lastScannedCode && (
                      <div className="scan-success-alert">
                        <CheckCircle2 size={24} />
                        <div>
                          <div style={{ fontSize: "14px" }}>
                            Nhập kho thành công mã:
                          </div>
                          <div style={{ color: "#047857" }}>
                            {lastScannedCode}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="scanner-frame">
                      <div className="scanner-target"></div>
                      {isScanning ? (
                        <Scanner
                          onScan={handleScanSuccess}
                          onError={(error) => console.log(error)}
                          components={{ finder: false, audio: true }}
                          styles={{
                            container: { width: "100%", height: "100%" },
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#64748b",
                          }}
                        >
                          <Camera size={48} opacity={0.5} />
                        </div>
                      )}
                    </div>

                    <button
                      className={`scan-action-btn ${isScanning ? "stop" : ""}`}
                      onClick={() => {
                        setIsScanning(!isScanning);
                        setLastScannedCode(null);
                      }}
                    >
                      <ScanLine size={20} />
                      {isScanning ? "DỪNG QUÉT" : "KÍCH HOẠT MÁY QUÉT"}
                    </button>
                  </div>
                )}

                {activeTab === "settings" && (
                  <form className="settings-form" style={{ maxWidth: "100%" }}>
                    <div className="settings-group">
                      <h4>
                        <Truck size={18} /> Thông tin Phân phối
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
                          <label>Tên Đơn vị</label>
                          <input
                            type="text"
                            value={supplierInfo.entityName}
                            onChange={(e) =>
                              setSupplierInfo({
                                ...supplierInfo,
                                entityName: e.target.value,
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
                            value={supplierInfo.email}
                            onChange={(e) =>
                              setSupplierInfo({
                                ...supplierInfo,
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
                        <div className="input-group">
                          <label>Khu vực hoạt động</label>
                          <input
                            type="text"
                            value={supplierInfo.region}
                            onChange={(e) =>
                              setSupplierInfo({
                                ...supplierInfo,
                                region: e.target.value,
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
                          <label>Loại hình Dịch vụ</label>
                          <input
                            type="text"
                            value={supplierInfo.services}
                            onChange={(e) =>
                              setSupplierInfo({
                                ...supplierInfo,
                                services: e.target.value,
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
                        alert("Đã lưu thay đổi!");
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
