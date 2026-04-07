import { Activity, Calendar, Camera, CheckCircle, Globe, History, KeyRound, Mail, MapPin, Package, Phone, Settings, ShieldCheck, Users, X } from "lucide-react";
import defaultAvatar from "../../assets/image.png";
import ScanCard from "../ScanCard";
import ChangePassword from "./ChangePassword";
import DashboardTabNav from "./DashboardTabNav";
import UserProfileSettings from "./UserProfileSettings";

const USER_DASHBOARD_TABS = [
  { id: "history", icon: History, label: "Scan History" },
  { id: "active", icon: CheckCircle, label: "Active Codes" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const SCAN_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "20px",
};

// Ham nay dung de format ngay trong dashboard user theo giao dien en-GB.
// Nhan vao: value la ngay can hien thi.
// Tra ve: chuoi da format hoac "Pending update" neu khong hop le.
const formatDateLabel = (value) => {
  if (!value) {
    return "Pending update";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Pending update";
  }

  return parsedDate.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Ham nay dung de render mot khung rong khi user chua co ma nao trong history/active.
// Nhan vao: title va description de thong bao nguoi dung.
// Tra ve: JSX empty state co ban de giu dashboard khong bi trong trai.
function UserDashboardEmptyState({ title, description }) {
  return (
    <div className="dashboard-empty-state">
      <div className="dashboard-empty-icon">
        <Package size={20} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// Ham nay dung de render o claim Token(2) trong tab Active Codes cua user dashboard.
// Nhan vao: claimTokenValue, feedback, isSubmitting va cac handler input/submit.
// Tra ve: JSX khung nhap token de user claim lai QR ve tai khoan.
function UserTokenClaimPanel({
  claimTokenValue,
  feedback,
  isSubmitting,
  onChange,
  onSubmit,
}) {
  return (
    <form className="token-claim-panel" onSubmit={onSubmit}>
      <div className="token-claim-header">
        <div className="token-claim-icon">
          <KeyRound size={18} />
        </div>
        <div>
          <h3>Claim Token (2)</h3>
          <p>Paste the saved Token (2) or the claim URL to attach a guest QR to your account.</p>
        </div>
      </div>

      <div className="token-claim-form-row">
        <div className="token-claim-input-shell">
          <input
            type="text"
            className="token-claim-input"
            value={claimTokenValue}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste Token (2) or claim URL"
          />
        </div>

        <button type="submit" className="save-btn token-claim-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "CLAIMING..." : "CLAIM TOKEN"}
        </button>
      </div>

      {feedback.message ? <div className={`profile-feedback ${feedback.type || "success"}`}>{feedback.message}</div> : null}
    </form>
  );
}

// Ham nay dung de render thanh thong tin ben trai cua dashboard user.
// Nhan vao: userInfo la du lieu user, fileInputRef la ref input avatar, onAvatarChange la ham doi anh.
// Tra ve: JSX sidebar hien avatar va thong tin co ban cua user.
export function UserDashboardSidebar({ userInfo, fileInputRef, onAvatarChange }) {
  const displayName = userInfo.fullName || "User";
  const displayEmail = userInfo.email || "Not updated";
  const displayPhone = userInfo.phone || "Not updated";
  const displayDob = typeof userInfo.dob === "string" && userInfo.dob.includes("T") ? userInfo.dob.split("T")[0] : userInfo.dob || "Not updated";
  const displayGender = userInfo.gender === "male" ? "Male" : userInfo.gender === "female" ? "Female" : userInfo.gender === "other" ? "Other" : userInfo.gender === "secret" ? "Prefer not to say" : "Not updated";
  const resolvedAvatar = typeof userInfo.avatar === "string" && userInfo.avatar.trim() ? userInfo.avatar : defaultAvatar;

  return (
    <aside className="user-sidebar">
      <div className="avatar-wrapper">
        <img
          src={resolvedAvatar}
          alt="Avatar"
          className="avatar-img"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = defaultAvatar;
          }}
        />
        <button type="button" className="upload-avatar-btn" onClick={() => fileInputRef.current?.click()}>
          <Camera size={16} />
        </button>
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={onAvatarChange} />
      </div>

      <div className="user-sidebar-info">
        <h3 className="user-name">{displayName}</h3>

        <div className="user-info-list">
          <div className="info-item">
            <Mail size={16} className="icon" /> {displayEmail}
          </div>
          <div className="info-item">
            <Phone size={16} className="icon" /> {displayPhone}
          </div>
          <div className="info-item">
            <Calendar size={16} className="icon" /> {displayDob}
          </div>
          <div className="info-item">
            <Users size={16} className="icon" />
            {displayGender}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Ham nay dung de render noi dung chinh cua dashboard user theo tab dang duoc chon.
// Nhan vao: activeTab, scanHistoryData, activeScans va cac handler dieu huong/luu thong tin.
// Tra ve: JSX noi dung tab lich su quet, ma dang hoat dong va form settings.
export function UserDashboardContent({
  activeTab,
  scanHistoryData,
  activeScans,
  claimFeedback,
  claimTokenValue,
  dashboardMessage,
  isDashboardLoading,
  isClaimingToken,
  onOpenScanDetails,
  onClaimTokenInputChange,
  onClaimTokenSubmit,
  onDeleteHistoryRequest,
  onTabChange,
  userInfo,
  avatarInputRef,
  avatarFileName,
  isAvatarDragging,
  isProfileSaving,
  profileFeedback,
  onAvatarChange,
  onAvatarDrop,
  onAvatarDragLeave,
  onAvatarDragOver,
  onProfileFieldChange,
  onProfileSubmit,
}) {
  return (
    <section className="dashboard-content">
      <DashboardTabNav items={USER_DASHBOARD_TABS} activeTab={activeTab} onChange={onTabChange} />

      <div className="tab-body">
        {activeTab === "history" ? (
          isDashboardLoading ? (
            <UserDashboardEmptyState title="Loading your scan history" description="Please wait while we pull your tracked QR activity from the database." />
          ) : (
            <div className="dashboard-stack">
              {claimFeedback.message ? <div className={`profile-feedback ${claimFeedback.type || "success"}`}>{claimFeedback.message}</div> : null}
              {scanHistoryData.length > 0 ? (
                <div className="history-grid scan-grid" style={SCAN_GRID_STYLE}>
                  {scanHistoryData.map((item) => (
                    <ScanCard
                      key={item.id}
                      scan={item}
                      onDelete={() => onDeleteHistoryRequest(item.id)}
                      onViewDetails={() => onOpenScanDetails(item)}
                    />
                  ))}
                </div>
              ) : (
                <UserDashboardEmptyState title="No scan history yet" description={dashboardMessage || "Scan now to start building the tracking history for your QR codes."} />
              )}
            </div>
          )
        ) : null}

        {activeTab === "active" ? (
          isDashboardLoading ? (
            <UserDashboardEmptyState title="Loading active codes" description="We are checking which QR codes are currently attached to your account." />
          ) : activeScans.length > 0 ? (
            <div className="dashboard-stack">
              <UserTokenClaimPanel
                claimTokenValue={claimTokenValue}
                feedback={claimFeedback}
                isSubmitting={isClaimingToken}
                onChange={onClaimTokenInputChange}
                onSubmit={onClaimTokenSubmit}
              />

              <div className="history-grid scan-grid" style={SCAN_GRID_STYLE}>
                {activeScans.map((item) => (
                  <ScanCard key={item.id} scan={item} onViewDetails={() => onOpenScanDetails(item)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="dashboard-stack">
              <UserTokenClaimPanel
                claimTokenValue={claimTokenValue}
                feedback={claimFeedback}
                isSubmitting={isClaimingToken}
                onChange={onClaimTokenInputChange}
                onSubmit={onClaimTokenSubmit}
              />
              <UserDashboardEmptyState title="No active codes yet" description="Scan now to track your code and keep it connected to your account." />
            </div>
          )
        ) : null}

        {activeTab === "settings" ? (
          <div className="settings-stack">
            <UserProfileSettings
              userInfo={userInfo}
              avatarInputRef={avatarInputRef}
              avatarFileName={avatarFileName}
              isAvatarDragging={isAvatarDragging}
              isSubmitting={isProfileSaving}
              feedback={profileFeedback}
              onFieldChange={onProfileFieldChange}
              onSubmit={onProfileSubmit}
              onAvatarChange={onAvatarChange}
              onAvatarDrop={onAvatarDrop}
              onAvatarDragLeave={onAvatarDragLeave}
              onAvatarDragOver={onAvatarDragOver}
            />

            <ChangePassword />
          </div>
        ) : null}
      </div>
    </section>
  );
}

// Ham nay dung de render modal chi tiet san pham/scan cua item duoc chon trong dashboard user.
// Nhan vao: scan la item dang xem, onClose la ham dong modal.
// Tra ve: JSX modal hoac null neu khong co item nao duoc chon.
export function UserScanDetailsModal({ scan, onClose }) {
  if (!scan) return null;

  const details = scan.details || {};
  const scanMeta = scan.scanMeta || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Activity size={20} /> Product Details
          </h3>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body modal-body-detail">
          <div className="modal-detail-heading">
            <div>
              <p className="modal-kicker">{scan.qrType}</p>
              <h4>{details.productName || scan.productName || "Tracked product"}</h4>
              <p className="modal-subtitle">{details.brandName || scan.brandName || "Pending brand"}</p>
            </div>

            <div className={`scan-status-chip ${scan.statusTone || "active"}`}>
              <ShieldCheck size={14} />
              <span>{scan.statusLabel || "ACTIVE"}</span>
            </div>
          </div>

          <div className="modal-qr-pair">
            {scan.qrImages?.websiteLink ? (
              <div className="scan-qr-box">
                <small>Website Link QR</small>
                <img src={scan.qrImages.websiteLink} alt="Website Link QR" className="qr-thumb qr-thumb-large" />
              </div>
            ) : null}

            {scan.qrImages?.savedScan ? (
              <div className="scan-qr-box">
                <small>Saved Scan QR</small>
                <img src={scan.qrImages.savedScan} alt="Saved Scan QR" className="qr-thumb qr-thumb-large" />
              </div>
            ) : null}
          </div>

          <div className="modal-detail-grid">
            <div className="modal-detail-item">
              <span>Manufacturer</span>
              <strong>{details.manufacturerName || "Pending update"}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Origin</span>
              <strong>{details.originCountry || "Pending update"}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Batch Code</span>
              <strong>{details.batchCode || "Pending update"}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Manufacture Date</span>
              <strong>{formatDateLabel(details.manufactureDate)}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Expiry Date</span>
              <strong>{formatDateLabel(details.expiryDate)}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Activated At</span>
              <strong>{formatDateLabel(details.activatedAt)}</strong>
            </div>
          </div>

          <div className="modal-copy-block">
            <span>Quality Certifications</span>
            <p>{details.qualityCertifications || "Pending update"}</p>
          </div>

          <div className="modal-copy-block">
            <span>Description</span>
            <p>{details.description || "No additional product description has been provided yet."}</p>
          </div>

          {scan.scope === "history" ? (
            <div className="modal-detail-grid">
              <div className="modal-detail-item">
                <span>Scanned At</span>
                <strong>{formatDateLabel(scan.scannedAt)}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Location</span>
                <strong>
                  <MapPin size={14} />
                  {scanMeta.location || "Pending update"}
                </strong>
              </div>
              <div className="modal-detail-item">
                <span>Device</span>
                <strong>{scanMeta.deviceInfo || "Pending update"}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Scan Result</span>
                <strong>{scanMeta.scanResult || scan.statusLabel || "Pending update"}</strong>
              </div>
            </div>
          ) : (
            <div className="modal-detail-grid">
              <div className="modal-detail-item">
                <span>Bound At</span>
                <strong>{formatDateLabel(scan.boundAt)}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Total Public Scans</span>
                <strong>{details.totalPublicScans ?? 0}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Secret Attempts</span>
                <strong>{details.totalPinAttempts ?? 0}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Authentication Scans</span>
                <strong>{details.totalPublicScans ?? 0}</strong>
              </div>
            </div>
          )}

          {scan.websiteLinkUrl ? (
            <a href={scan.websiteLinkUrl} target="_blank" rel="noreferrer" className="modal-link-btn">
              <Globe size={16} />
              Open Website QR Flow
            </a>
          ) : details.generalInfoUrl ? (
            <a href={details.generalInfoUrl} target="_blank" rel="noreferrer" className="modal-link-btn">
              <Globe size={16} />
              Open Product Page
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Ham nay dung de hien modal xac nhan khi user muon xoa mem mot item lich su scan.
// Nhan vao: isOpen, onClose, onConfirm va isSubmitting de khoa nut khi dang xu ly.
// Tra ve: JSX modal xac nhan hoac null neu khong co item nao duoc chon.
export function UserConfirmActionModal({ isOpen, isSubmitting, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-confirm" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Remove Scan History</h3>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body-confirm">
          <p>This action only hides the scan from your personal history. The master verification log stays intact.</p>

          <div className="confirm-modal-actions">
            <button type="button" className="scan-delete-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="button" className="save-btn" onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? "REMOVING..." : "YES, REMOVE IT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
