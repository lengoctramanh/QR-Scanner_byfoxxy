import { Building, Camera, Eye, EyeOff, FileSpreadsheet, Globe, Mail, MapPin, Package, Phone, PlusCircle, Settings, UploadCloud, X } from "lucide-react";
import DashboardTabNav from "./DashboardTabNav";
import defaultAvatar from "../../assets/image.png";

const DEFAULT_BRAND_LOGO = "/pictures/logo/logoDefault.png";

const BRAND_DASHBOARD_TABS = [
  { id: "manage", icon: Package, label: "Manage Products" },
  { id: "create", icon: PlusCircle, label: "Issue QR Codes" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const INPUT_STYLE = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
};

const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
};

const TOGGLE_BUTTON_STYLE = {
  position: "absolute",
  right: "10px",
  top: "10px",
  background: "none",
  border: "none",
  color: "#94a3b8",
};

// Ham nay dung de render sidebar thong tin thuong hieu trong dashboard brand.
// Nhan vao: brandInfo la du lieu brand, avatarInputRef la ref input avatar, onAvatarChange la ham doi avatar.
// Tra ve: JSX sidebar hien avatar tai khoan, logo thuong hieu va thong tin lien he cua brand.
export function BrandDashboardSidebar({ brandInfo, avatarInputRef, onAvatarChange }) {
  const displayName = brandInfo.fullName || "Pending update";
  const displayBusinessName = brandInfo.businessName || "Pending update";
  const displayTaxId = brandInfo.taxId || "Pending update";
  const displayEmail = brandInfo.email || "Pending update";
  const displayPhone = brandInfo.phone || "Pending update";
  const displayAddress = brandInfo.address || "Pending update";
  const displayWebsite = brandInfo.website || "Pending update";

  return (
    <aside className="brand-sidebar">
      <div className="brand-avatar-wrapper">
        <img
          src={brandInfo.avatar || defaultAvatar}
          alt="Brand Avatar"
          className="brand-avatar-img"
          onError={(event) => {
            event.currentTarget.src = defaultAvatar;
          }}
        />
        <button type="button" className="upload-avatar-btn" onClick={() => avatarInputRef.current?.click()}>
          <Camera size={16} />
        </button>
        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={onAvatarChange} />
      </div>

      <div className="user-sidebar-info" style={{ width: "100%" }}>
        <h3 className="user-name" style={{ color: "#3f78c9" }}>
          {displayName}
        </h3>
        <h3 className="user-name" style={{ color: "#3f78c9" }}>
          {displayBusinessName}
        </h3>
        <p className="user-username" style={{ textAlign: "center" }}>
          Tax ID: {displayTaxId}
        </p>

        <div className="brand-logo-showcase">
          <img
            src={brandInfo.logo || DEFAULT_BRAND_LOGO}
            alt="Brand Logo"
            className="brand-logo-img"
            onError={(event) => {
              event.currentTarget.src = DEFAULT_BRAND_LOGO;
            }}
          />
        </div>

        <div className="user-info-list">
          <div className="info-item">
            <Mail size={16} className="icon" /> {displayEmail}
          </div>
          <div className="info-item">
            <Phone size={16} className="icon" /> {displayPhone}
          </div>
          <div className="info-item">
            <MapPin size={16} className="icon" /> {displayAddress}
          </div>
          <div className="info-item">
            <Globe size={16} className="icon" />{" "}
            {brandInfo.website ? (
              <a href={brandInfo.website} target="_blank" rel="noreferrer" style={{ color: "#475569" }}>
                {displayWebsite}
              </a>
            ) : (
              <span>{displayWebsite}</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Ham nay dung de render noi dung chinh cua dashboard brand theo tung tab.
// Nhan vao: toan bo state va handler duoc hook dashboard brand truyen xuong.
// Tra ve: JSX noi dung tab quan ly san pham, tao QR va cai dat.
export function BrandDashboardContent({
  activeTab,
  brandInfo,
  excelFile,
  excelInputRef,
  isDragging,
  passwords,
  qrForm,
  showPasswords,
  onBrandInfoChange,
  onExcelChange,
  onExcelDragLeave,
  onExcelDragOver,
  onExcelDrop,
  onExcelRemove,
  onExcelSubmit,
  onManualQrSubmit,
  onPasswordChange,
  onPasswordVisibilityToggle,
  onQrFormChange,
  onSettingsSubmit,
  onSystemGeneratedToggle,
  onTabChange,
}) {
  return (
    <section className="dashboard-content">
      <DashboardTabNav items={BRAND_DASHBOARD_TABS} activeTab={activeTab} onChange={onTabChange} />

      <div className="tab-body">
        {activeTab === "manage" ? <ManageProductsSection /> : null}
        {activeTab === "create" ? (
          <IssueQrSection
            excelFile={excelFile}
            excelInputRef={excelInputRef}
            isDragging={isDragging}
            qrForm={qrForm}
            onExcelChange={onExcelChange}
            onExcelDragLeave={onExcelDragLeave}
            onExcelDragOver={onExcelDragOver}
            onExcelDrop={onExcelDrop}
            onExcelRemove={onExcelRemove}
            onExcelSubmit={onExcelSubmit}
            onManualQrSubmit={onManualQrSubmit}
            onQrFormChange={onQrFormChange}
            onSystemGeneratedToggle={onSystemGeneratedToggle}
          />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsSection
            brandInfo={brandInfo}
            passwords={passwords}
            showPasswords={showPasswords}
            onBrandInfoChange={onBrandInfoChange}
            onPasswordChange={onPasswordChange}
            onPasswordVisibilityToggle={onPasswordVisibilityToggle}
            onSettingsSubmit={onSettingsSubmit}
          />
        ) : null}
      </div>
    </section>
  );
}

// Ham nay dung de render tab quan ly san pham cua brand.
// Nhan vao: khong nhan props nao.
// Tra ve: JSX thong bao trang thai tab manage products.
function ManageProductsSection() {
  return (
    <div>
      <h3 style={{ color: "#3f78c9", marginTop: 0 }}>Issued QR code catalog</h3>
      <p style={{ color: "#64748b" }}>The product list and dashboard charts are still being completed.</p>
    </div>
  );
}

// Ham nay dung de render tab tao QR thu cong va upload batch Excel.
// Nhan vao: du lieu form QR, file Excel va cac handler xu ly upload/submit.
// Tra ve: JSX hai khu vuc tao QR thu cong va dang ky batch.
function IssueQrSection({
  excelFile,
  excelInputRef,
  isDragging,
  qrForm,
  onExcelChange,
  onExcelDragLeave,
  onExcelDragOver,
  onExcelDrop,
  onExcelRemove,
  onExcelSubmit,
  onManualQrSubmit,
  onQrFormChange,
  onSystemGeneratedToggle,
}) {
  return (
    <div className="qr-creation-grid">
      <div className="creation-section">
        <h4 className="section-title">
          <Package size={20} color="#3f78c9" /> Manual Product Entry
        </h4>
        <form onSubmit={onManualQrSubmit}>
          <div className="input-group" style={{ marginBottom: "15px" }}>
            <label>Product Name *</label>
            <input type="text" required placeholder="Example: ABC Facial Cleanser" value={qrForm.productName} onChange={(event) => onQrFormChange("productName", event.target.value)} className="input-wrap" style={INPUT_STYLE} />
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
            }}>
            <label className="toggle-switch">
              <input type="checkbox" checked={qrForm.isSystemGenerated} onChange={(event) => onSystemGeneratedToggle(event.target.checked)} />
              <span className="slider"></span>
            </label>
            <div>
              <span
                style={{
                  fontWeight: 700,
                  color: "#1e293b",
                  display: "block",
                  fontSize: "14px",
                }}>
                Let the system generate the QR code
              </span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>This creates a random and more secure token automatically.</span>
            </div>
          </div>

          {!qrForm.isSystemGenerated ? (
            <div className="input-group" style={{ marginBottom: "15px" }}>
              <label>Your Custom QR Payload *</label>
              <input type="text" required placeholder="Example: BRAND-PRODUCT-001" value={qrForm.qrCodeString} onChange={(event) => onQrFormChange("qrCodeString", event.target.value)} style={{ ...INPUT_STYLE, background: "#fff" }} />
            </div>
          ) : null}

          <div className="input-group" style={{ marginBottom: "20px" }}>
            <label>Suspicious Scan Limit</label>
            <input type="number" min="1" max="100" value={qrForm.scanLimit} onChange={(event) => onQrFormChange("scanLimit", event.target.value)} style={INPUT_STYLE} />
          </div>

          <button type="submit" className="save-btn" style={{ width: "100%" }}>
            CREATE QR CODE
          </button>
        </form>
      </div>

      <div className="creation-section">
        <h4 className="section-title">
          <FileSpreadsheet size={20} color="#10b981" /> Batch Registration (Excel)
        </h4>
        <p
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginBottom: "20px",
          }}>
          Use a template file (.xlsx, .csv) with a large product list and matching QR values so the system can process everything in one batch.
        </p>

        <input type="file" accept=".xls,.xlsx,.csv" ref={excelInputRef} style={{ display: "none" }} onChange={onExcelChange} />

        {!excelFile ? (
          <div className={`excel-upload-zone ${isDragging ? "dragging" : ""}`} onClick={() => excelInputRef.current?.click()} onDragOver={onExcelDragOver} onDragLeave={onExcelDragLeave} onDrop={onExcelDrop}>
            <UploadCloud size={36} />
            <span>Drag your Excel file here or click to choose one</span>
            <small>Supported formats: .xls, .xlsx, .csv</small>
          </div>
        ) : (
          <div
            className="file-selected-box"
            style={{
              borderColor: "#10b981",
              background: "#f0fdf4",
              padding: "15px",
            }}>
            <div className="file-info">
              <FileSpreadsheet size={20} color="#10b981" className="file-icon" />
              <span className="file-name" style={{ color: "#059669", fontWeight: 700 }}>
                {excelFile.name}
              </span>
            </div>
            <button type="button" className="remove-file-btn" onClick={onExcelRemove}>
              <X size={20} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onExcelSubmit}
          className="save-btn"
          disabled={!excelFile}
          style={{
            width: "100%",
            marginTop: "20px",
            background: excelFile ? "linear-gradient(180deg, #34d399 0%, #10b981 100%)" : "#cbd5e1",
            boxShadow: "none",
          }}>
          UPLOAD AND PROCESS BATCH
        </button>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <a
            href="#"
            style={{
              color: "#3f78c9",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "underline",
            }}>
            Download the Excel Template
          </a>
        </div>
      </div>
    </div>
  );
}

// Ham nay dung de render tab cai dat thong tin brand va doi mat khau.
// Nhan vao: du lieu brand, du lieu mat khau va cac handler cap nhat/submit.
// Tra ve: JSX form settings cua brand.
function SettingsSection({ brandInfo, passwords, showPasswords, onBrandInfoChange, onPasswordChange, onPasswordVisibilityToggle, onSettingsSubmit }) {
  return (
    <form className="settings-form" style={{ maxWidth: "100%" }} onSubmit={onSettingsSubmit}>
      <div className="settings-group">
        <h4>
          <Building size={18} /> Business Profile
        </h4>
        <div className="input-grid" style={GRID_STYLE}>
          <div className="input-group">
            <label>Business Name</label>
            <input type="text" value={brandInfo.businessName} onChange={(event) => onBrandInfoChange("businessName", event.target.value)} style={INPUT_STYLE} />
          </div>
          <div className="input-group">
            <label>Contact Email</label>
            <input type="email" value={brandInfo.email} onChange={(event) => onBrandInfoChange("email", event.target.value)} style={INPUT_STYLE} />
          </div>
          <div className="input-group">
            <label>Phone Number</label>
            <input type="text" value={brandInfo.phone} onChange={(event) => onBrandInfoChange("phone", event.target.value)} style={INPUT_STYLE} />
          </div>
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label>Business Address</label>
            <input type="text" value={brandInfo.address} onChange={(event) => onBrandInfoChange("address", event.target.value)} style={INPUT_STYLE} />
          </div>
          <div className="input-group">
            <label>Website</label>
            <input type="text" value={brandInfo.website} onChange={(event) => onBrandInfoChange("website", event.target.value)} style={INPUT_STYLE} />
          </div>
          <div className="input-group">
            <label>Tax ID</label>
            <input type="text" value={brandInfo.taxId} onChange={(event) => onBrandInfoChange("taxId", event.target.value)} style={INPUT_STYLE} />
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>
          <Settings size={18} /> Change Password
        </h4>
        <div className="input-grid" style={GRID_STYLE}>
          <PasswordField label="New Password" value={passwords.new} showValue={showPasswords.new} onChange={(event) => onPasswordChange("new", event.target.value)} onToggleVisibility={() => onPasswordVisibilityToggle("new")} />
          <PasswordField label="Confirm Password" value={passwords.confirm} showValue={showPasswords.confirm} onChange={(event) => onPasswordChange("confirm", event.target.value)} onToggleVisibility={() => onPasswordVisibilityToggle("confirm")} />
        </div>
      </div>

      <button type="submit" className="save-btn">
        SAVE CHANGES
      </button>
    </form>
  );
}

// Ham nay dung de render mot o nhap mat khau co nut an hien gia tri.
// Nhan vao: label, value, showValue va cac handler thay doi/hien thi mat khau.
// Tra ve: JSX field mat khau dung chung trong settings brand.
function PasswordField({ label, value, showValue, onChange, onToggleVisibility }) {
  return (
    <div className="input-group pw-input-wrap">
      <label>{label}</label>
      <div style={{ position: "relative" }}>
        <input type={showValue ? "text" : "password"} placeholder="........" value={value} onChange={onChange} style={INPUT_STYLE} />
        <button type="button" className="toggle-pw-btn" onClick={onToggleVisibility} style={TOGGLE_BUTTON_STYLE}>
          {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
