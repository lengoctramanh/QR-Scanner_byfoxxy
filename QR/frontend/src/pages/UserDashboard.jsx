import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  QrCode,
  Menu,
  User,
  History,
  CheckCircle,
  Settings,
  Camera,
  Calendar,
  Users,
  Mail,
  Eye,
  EyeOff,
  Clock,
  Package,
  Activity,
  X,
  Search,
  Phone, // Đã thêm icon Phone
} from "lucide-react";
import "../assets/style.css";
import "./UserDashboard.css";

// Hàm tính thời gian thực
const calculateTimeLeft = (expiryDate) => {
  if (!expiryDate) return "Không thời hạn";
  const difference = new Date(expiryDate) - new Date();
  if (difference <= 0) return "Đã hết hạn";

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);

  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  return `Còn ${hours} giờ ${minutes} phút`;
};

export default function UserDashboard() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- STATES ---
  // Đã tách identifier thành email và phone
  const [userInfo, setUserInfo] = useState({
    fullName: "Đang tải...",
    email: "...",
    phone: "...",
    dob: "",
    gender: "male",
    avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  });

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Modal State
  const [selectedScan, setSelectedScan] = useState(null);

  // Mock Data
  const [scans, setScans] = useState([
    {
      id: "scan-1",
      qr_id: "qr-001",
      qrType: "Sản phẩm",
      productName: "Giày Nike Air Max 97",
      expiryDate: new Date(Date.now() + 86400000 * 3),
      scanTimes: ["2026-03-08 14:00:22", "2026-03-07 09:15:00"],
      qrImage:
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
    },
    {
      id: "scan-2",
      qr_id: "qr-002",
      qrType: "Vé Sự kiện",
      productName: "Vé Đại nhạc hội EDM",
      expiryDate: new Date(Date.now() - 86400000),
      scanTimes: ["2026-03-05 09:30:11"],
      qrImage:
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
    },
    {
      id: "scan-3",
      qr_id: "qr-001",
      qrType: "Sản phẩm",
      productName: "Giày Nike Air Max 97",
      expiryDate: new Date(Date.now() + 86400000 * 3),
      scanTimes: ["2026-03-06 11:00:00"],
      qrImage:
        "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
    },
  ]);

  const [, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Tạm thời set mock data đẹp có chứa email và phone
    setUserInfo({
      fullName: "Thành Tuấn",
      email: "thanhtuan1005@gmail.com",
      phone: "0123456789",
      dob: "2005-10-23",
      gender: "male",
      avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    });
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserInfo({ ...userInfo, avatar: imageUrl });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (passwords.new && passwords.new !== passwords.confirm) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    alert("Cập nhật thông tin thành công!");
    setPasswords({ old: "", new: "", confirm: "" });
  };

  const activeScans = scans.filter((s) => new Date(s.expiryDate) > new Date());
  const uniqueActiveScans = Array.from(
    new Map(activeScans.map((item) => [item.qr_id, item])).values(),
  );

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
              <Link to="/about">Giới thiệu</Link>
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
            <aside className="user-sidebar">
              <div className="avatar-wrapper">
                <img
                  src={userInfo.avatar}
                  alt="Avatar"
                  className="avatar-img"
                />
                <button
                  className="upload-avatar-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Camera size={16} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="user-sidebar-info">
                <h3 className="user-name">{userInfo.fullName}</h3>
                <p className="user-username">@{userInfo.email.split("@")[0]}</p>

                <div className="user-info-list">
                  <div className="info-item">
                    <Mail size={16} className="icon" /> {userInfo.email}
                  </div>
                  <div className="info-item">
                    <Phone size={16} className="icon" /> {userInfo.phone}
                  </div>
                  <div className="info-item">
                    <Calendar size={16} className="icon" />{" "}
                    {userInfo.dob || "Chưa cập nhật"}
                  </div>
                  <div className="info-item">
                    <Users size={16} className="icon" />
                    {userInfo.gender === "male"
                      ? "Nam"
                      : userInfo.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                  </div>
                </div>
              </div>
            </aside>

            <section className="dashboard-content">
              <div className="tab-nav">
                <button
                  className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <History size={18} /> Lịch sử quét
                </button>
                <button
                  className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
                  onClick={() => setActiveTab("active")}
                >
                  <CheckCircle size={18} /> Mã còn hạn
                </button>
                <button
                  className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings size={18} /> Cài đặt
                </button>
              </div>

              <div className="tab-body">
                {activeTab === "history" && (
                  <div className="scan-grid">
                    {scans.map((scan) => (
                      <ScanCard
                        key={scan.id}
                        scan={scan}
                        onViewDetails={() => setSelectedScan(scan)}
                      />
                    ))}
                  </div>
                )}

                {activeTab === "active" && (
                  <div className="scan-grid">
                    {uniqueActiveScans.length > 0 ? (
                      uniqueActiveScans.map((scan) => (
                        <ScanCard
                          key={scan.id}
                          scan={scan}
                          onViewDetails={() => setSelectedScan(scan)}
                        />
                      ))
                    ) : (
                      <p style={{ color: "#64748b" }}>
                        Bạn chưa có mã nào đang còn hiệu lực.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "settings" && (
                  <form className="settings-form" onSubmit={handleSaveSettings}>
                    <div className="settings-group">
                      <h4>
                        <User size={18} /> Thông tin cá nhân
                      </h4>
                      {/* ĐÃ CHỈNH SỬA THÀNH GRID 2x2 CỰC ĐẸP Ở ĐÂY */}
                      <div
                        className="input-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "15px",
                        }}
                      >
                        <div className="input-group">
                          <label>Họ và Tên</label>
                          <input
                            type="text"
                            value={userInfo.fullName}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                fullName: e.target.value,
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
                          <label>Email</label>
                          <input
                            type="email"
                            value={userInfo.email}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
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
                          <label>Ngày sinh</label>
                          <input
                            type="date"
                            value={userInfo.dob}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, dob: e.target.value })
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
                          <label>Số điện thoại</label>
                          <input
                            type="tel"
                            value={userInfo.phone}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                phone: e.target.value,
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
                          gridTemplateColumns: "1fr",
                          gap: "15px",
                        }}
                      >
                        <div className="input-group pw-input-wrap">
                          <label>Mật khẩu cũ</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type={showPw.old ? "text" : "password"}
                              placeholder="••••••••"
                              value={passwords.old}
                              onChange={(e) =>
                                setPasswords({
                                  ...passwords,
                                  old: e.target.value,
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
                                setShowPw({ ...showPw, old: !showPw.old })
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
                              {showPw.old ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>

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

                    <button type="submit" className="save-btn">
                      LƯU THAY ĐỔI
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>
        </main>

        {selectedScan && (
          <div className="modal-overlay" onClick={() => setSelectedScan(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <Activity size={20} /> Lịch sử quét chi tiết
                </h3>
                <button
                  className="close-modal-btn"
                  onClick={() => setSelectedScan(null)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p
                  style={{ marginTop: 0, fontWeight: "bold", color: "#1e293b" }}
                >
                  {selectedScan.productName}
                </p>
                <ul className="scan-times-list">
                  {selectedScan.scanTimes.map((time, index) => (
                    <li key={index}>
                      <Clock size={16} color="#3f78c9" /> {time}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScanCard({ scan, onViewDetails }) {
  const timeLeft = calculateTimeLeft(scan.expiryDate);
  const isExpired = timeLeft === "Đã hết hạn";

  return (
    <div className="scan-card">
      <div className="scan-header">
        <span className="scan-type">{scan.qrType}</span>
        <img src={scan.qrImage} alt="QR" className="qr-thumb" />
      </div>

      <div className="scan-info">
        <h4>
          <Package
            size={16}
            style={{ verticalAlign: "middle", marginRight: "5px" }}
          />{" "}
          {scan.productName}
        </h4>
        <p className={`time-left ${!isExpired ? "active" : ""}`}>
          <Clock size={14} /> {timeLeft}
        </p>
      </div>

      <div className="scan-actions">
        <span className="scan-count" onClick={onViewDetails}>
          <Search size={14} /> Bị quét {scan.scanTimes.length} lần
        </span>
        <button className="view-btn">Xem SP</button>
      </div>
    </div>
  );
}
