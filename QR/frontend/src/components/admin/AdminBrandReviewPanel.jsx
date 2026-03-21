import { Check, Eye, RefreshCcw, ShieldAlert, X } from "lucide-react";
import { EmptyState, StatusPill } from "./AdminDashboardShared";
import { formatDateTime } from "../../utils/adminDashboardUtils";

// Ham nay dung de render bang review ho so dang ky brand voi du lieu live tu backend.
// Nhan vao: rows, isLoading, activeActionRequestId va cac callback review/approve/reject.
// Tra ve: JSX bang review, trang thai loading hoac empty state phu hop.
export default function AdminBrandReviewPanel({ rows, isLoading, activeActionRequestId, onReview, onApprove, onReject }) {
  const shouldEnableScroll = rows.length > 3;

  return (
    <section className="admin-panel-card">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">Priority Queue</span>
          <h3>Review brand registration packages</h3>
        </div>
        <div className="admin-heading-badge">
          <RefreshCcw size={16} /> Live queue from MySQL
        </div>
      </div>

      {isLoading ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">
            <RefreshCcw size={22} className="spin" />
          </div>
          <h4>Loading brand registrations</h4>
          <p>The latest registration queue is being synced from the database.</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No registrations waiting for review" description="The brand review queue is currently clear." />
      ) : (
        <div className={`admin-table-shell ${shouldEnableScroll ? "admin-table-shell-scroll" : ""}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Last update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((requestRow) => {
                const isRunning = activeActionRequestId === requestRow.requestId;

                return (
                  <tr key={requestRow.requestId}>
                    <td>
                      <div className="admin-cell-title">{requestRow.brandName}</div>
                      <div className="admin-cell-subtitle">
                        {requestRow.industry || "No industry"} / {requestRow.taxId}
                      </div>
                      <div className="admin-cell-meta">{requestRow.website || requestRow.fullName}</div>
                    </td>
                    <td>
                      <StatusPill value={requestRow.requestStatus} />
                    </td>
                    <td>
                      <div className="admin-cell-title">{requestRow.email || requestRow.phone || requestRow.loginIdentifier}</div>
                      <div className="admin-cell-subtitle">{requestRow.phone || "Phone not provided"}</div>
                    </td>
                    <td>
                      <div className="admin-cell-title">{requestRow.lastUpdatedLabel}</div>
                      <div className="admin-cell-subtitle">{formatDateTime(requestRow.lastUpdatedAt)}</div>
                    </td>
                    <td>
                      <div className="admin-action-column">
                        <button type="button" className="admin-action-btn ghost" onClick={() => onReview(requestRow.requestId)} disabled={isRunning}>
                          <Eye size={16} /> Review
                        </button>
                        <button type="button" className="admin-action-btn success" onClick={() => onApprove(requestRow.requestId)} disabled={isRunning}>
                          <Check size={16} /> {isRunning ? "Saving..." : "Approve"}
                        </button>
                        <button type="button" className="admin-action-btn danger" onClick={() => onReject(requestRow.requestId)} disabled={isRunning}>
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
