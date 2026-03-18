import { Activity, Calendar, Camera, CheckCircle, Clock, History, Mail, Phone, Settings, Users, X } from "lucide-react";
import ScanCard from "../ScanCard";
import DashboardTabNav from "./DashboardTabNav";

const USER_DASHBOARD_TABS = [
  { id: "history", icon: History, label: "Scan History" },
  { id: "active", icon: CheckCircle, label: "Active Codes" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const SCAN_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "20px",
};

export function UserDashboardSidebar({ userInfo, fileInputRef, onAvatarChange }) {
  return (
    <aside className="user-sidebar">
      <div className="avatar-wrapper">
        <img src={userInfo.avatar} alt="Avatar" className="avatar-img" />
        <button type="button" className="upload-avatar-btn" onClick={() => fileInputRef.current?.click()}>
          <Camera size={16} />
        </button>
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={onAvatarChange} />
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
            <Calendar size={16} className="icon" /> {userInfo.dob || "Not updated"}
          </div>
          <div className="info-item">
            <Users size={16} className="icon" />
            {userInfo.gender === "male" ? "Male" : userInfo.gender === "female" ? "Female" : "Other"}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function UserDashboardContent({ activeTab, scanHistoryData, activeScans, onOpenScanDetails, onSaveSettings, onTabChange }) {
  return (
    <section className="dashboard-content">
      <DashboardTabNav items={USER_DASHBOARD_TABS} activeTab={activeTab} onChange={onTabChange} />

      <div className="tab-body">
        {activeTab === "history" ? (
          <div className="history-grid scan-grid" style={SCAN_GRID_STYLE}>
            {scanHistoryData.map((item) => (
              <ScanCard key={item.id} scan={item} onViewDetails={() => onOpenScanDetails(item)} />
            ))}
          </div>
        ) : null}

        {activeTab === "active" ? (
          <div className="history-grid scan-grid" style={SCAN_GRID_STYLE}>
            {activeScans.length > 0 ? activeScans.map((item) => <ScanCard key={item.id} scan={item} onViewDetails={() => onOpenScanDetails(item)} />) : <p style={{ color: "#64748b" }}>You do not have any active codes yet.</p>}
          </div>
        ) : null}

        {activeTab === "settings" ? (
          <form className="settings-form" onSubmit={onSaveSettings}>
            <p style={{ fontStyle: "italic", color: "#666" }}>Your profile settings form can be connected here.</p>
            <button type="submit" className="save-btn">
              SAVE CHANGES
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export function UserScanDetailsModal({ scan, onClose }) {
  if (!scan) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Activity size={20} /> Detailed Scan History
          </h3>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0, fontWeight: "bold", color: "#1e293b" }}>{scan.productName}</p>
          <ul className="scan-times-list">
            {scan.scanTimes.map((time, index) => (
              <li key={index}>
                <Clock size={16} color="#3f78c9" /> {time}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
