import { X } from "lucide-react";
import { formatStatusLabel } from "../../utils/adminDashboardUtils";

export function StatusPill({ value }) {
  return (
    <span className="admin-status-pill" data-status={value}>
      {formatStatusLabel(value)}
    </span>
  );
}

export function StatCard({ icon: Icon, title, value, detail, tone }) {
  return (
    <article className="admin-stat-card" data-tone={tone}>
      <div className="admin-stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p className="admin-stat-title">{title}</p>
        <h3 className="admin-stat-value">{value}</h3>
        <span className="admin-stat-detail">{detail}</span>
      </div>
    </article>
  );
}

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
