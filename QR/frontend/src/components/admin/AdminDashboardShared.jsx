import { X } from "lucide-react";
import { formatStatusLabel } from "../../utils/adminDashboardUtils";

// Ham nay dung de hien thi nhan trang thai trong dashboard admin.
// Nhan vao: value la ma trang thai can hien thi.
// Tra ve: JSX span da duoc format ten trang thai.
export function StatusPill({ value }) {
  return (
    <span className="admin-status-pill" data-status={value}>
      {formatStatusLabel(value)}
    </span>
  );
}

// Ham nay dung de render mot the thong ke nho trong dashboard admin.
// Nhan vao: icon, title, value, detail va tone de hien thi so lieu.
// Tra ve: JSX card thong ke da duoc trang tri.
export function StatCard({ icon: Icon, title, value, detail, tone }) {
  return (
    <article className="admin-stat-card" data-tone={tone}>
      <div className="admin-stat-icon">
        <Icon size={20} />
      </div>
      <div className="admin-stat-copy">
        <p className="admin-stat-title">{title}</p>
        <h3 className="admin-stat-value">{value}</h3>
        <span className="admin-stat-detail">{detail}</span>
      </div>
    </article>
  );
}

// Ham nay dung de render modal chi tiet dung chung trong trang admin.
// Nhan vao: title, subtitle, onClose va children la noi dung modal.
// Tra ve: JSX modal co lop nen va khung noi dung ben trong.
export function DetailModal({ title, subtitle, onClose, children }) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}

// Ham nay dung de hien thi trang thai rong khi khong co du lieu trong admin.
// Nhan vao: icon, title va description mo ta noi dung rong.
// Tra ve: JSX khoi thong bao khong co du lieu.
export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-icon">
        <Icon size={22} />
      </div>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}
