import { useState } from "react";
import { Activity, BadgeCheck, Check, CheckSquare, Clock3, Eye, FileWarning, Layers3, ListTodo, LogOut, MonitorSmartphone, ShieldAlert, TriangleAlert, Users, Waypoints, X } from "lucide-react";
import { DetailModal, EmptyState, StatCard, StatusPill } from "../components/admin/AdminDashboardShared";
import { ADMIN_PROFILE, BRAND_PRIORITY, INITIAL_ACTIVE_SESSIONS, INITIAL_APPROVAL_REQUESTS, INITIAL_BRAND_PENDING_REVIEWS, INITIAL_QR_CODE_REQUESTS, INITIAL_QR_OVERVIEW, TAB_ITEMS } from "../data/adminDashboardData";
import useAuthCheck from "../hooks/useAuthCheck";
import { describeMinutesRemaining, formatDateTime, maskToken } from "../utils/adminDashboardUtils";
import "./AdminDashboard.css";
import "./UserDashboard.css";

export default function AdminDashboard() {
  useAuthCheck("admin");

  const [activeTab, setActiveTab] = useState("brands");
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [qrFilter, setQrFilter] = useState("ALL");
  const [brandPendingReviews, setBrandPendingReviews] = useState(INITIAL_BRAND_PENDING_REVIEWS);
  const [approvalRequests, setApprovalRequests] = useState(INITIAL_APPROVAL_REQUESTS);
  const [qrCodeRequests, setQrCodeRequests] = useState(INITIAL_QR_CODE_REQUESTS);
  const [qrOverviewRows] = useState(INITIAL_QR_OVERVIEW);
  const [activeSessions, setActiveSessions] = useState(INITIAL_ACTIVE_SESSIONS);
  const [activityBanner, setActivityBanner] = useState("The admin console is currently displaying mock data aligned with the active MySQL views and is ready to be connected to live APIs.");

  const sortedBrands = [...brandPendingReviews].sort((left, right) => (BRAND_PRIORITY[left.verification_status] ?? 99) - (BRAND_PRIORITY[right.verification_status] ?? 99) || new Date(left.account_registered_at) - new Date(right.account_registered_at));
  const filteredQrRows = qrFilter === "ALL" ? qrOverviewRows : qrOverviewRows.filter((item) => item.status === qrFilter);
  const suspiciousQrCount = qrOverviewRows.filter((item) => item.status === "SUSPICIOUS").length;
  const pendingApprovalCount = approvalRequests.filter((item) => item.status === "PENDING").length + qrCodeRequests.filter((item) => item.status === "PENDING" || item.status === "PROCESSING").length;
  const activeAdminSessions = activeSessions.filter((item) => item.role === "admin").length;
  const totalPublicScans = qrOverviewRows.reduce((total, item) => total + item.total_public_scans, 0);

  const handleBrandDecision = (brandId, nextStatus) => {
    setBrandPendingReviews((currentRows) => currentRows.filter((row) => row.brand_id !== brandId));
    setActivityBanner(
      nextStatus === "APPROVED"
        ? `Brand registration ${brandId} was approved and removed from the review queue.`
        : `Brand registration ${brandId} was rejected and sent back for resubmission.`,
    );
  };

  const handleApprovalDecision = (approvalId, nextStatus) => {
    setApprovalRequests((currentRows) =>
      currentRows.map((row) =>
        row.approval_id === approvalId
          ? {
              ...row,
              status: nextStatus,
              confirmed_at: new Date().toISOString(),
              rejection_reason: nextStatus === "REJECTED" ? "Mock reason: the proposed change does not have enough supporting evidence yet." : null,
            }
          : row,
      ),
    );
    setActivityBanner(`Approval request ${approvalId} moved to ${nextStatus}.`);
  };

  const handleQrRequestDecision = (requestId, nextStatus) => {
    setQrCodeRequests((currentRows) =>
      currentRows.map((row) =>
        row.request_id === requestId
          ? {
              ...row,
              status: nextStatus,
              processed_at: new Date().toISOString(),
              admin_note: nextStatus === "REJECTED" ? "Mock note: the import file does not match the template format yet." : "Mock note: the admin team accepted and is processing this request.",
            }
          : row,
      ),
    );
    setActivityBanner(`QR request ${requestId} moved to ${nextStatus}.`);
  };

  const handleRevokeSession = (sessionId) => {
    setActiveSessions((currentRows) => currentRows.filter((row) => row.session_id !== sessionId));
    setActivityBanner(`Session ${sessionId} was revoked.`);
  };

  const renderBrandTab = () => (
    <section className="admin-panel-card">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">Priority Queue</span>
          <h3>Review brand registration packages</h3>
        </div>
        <div className="admin-heading-badge">
          <ShieldAlert size={16} /> RESUBMITTED first
        </div>
      </div>

      {sortedBrands.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No registrations waiting for review" description="The brand review queue is currently clear." />
      ) : (
        <div className="admin-table-shell">
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
              {sortedBrands.map((brand) => (
                <tr key={brand.brand_id} className={brand.verification_status === "RESUBMITTED" ? "admin-priority-row" : ""}>
                  <td>
                    <div className="admin-cell-title">{brand.brand_name}</div>
                    <div className="admin-cell-subtitle">
                      {brand.industry} / {brand.tax_id}
                    </div>
                    <div className="admin-cell-meta">{brand.website}</div>
                  </td>
                  <td>
                    <StatusPill value={brand.verification_status} />
                  </td>
                  <td>
                    <div className="admin-cell-title">{brand.contact_email}</div>
                    <div className="admin-cell-subtitle">{brand.contact_phone}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{brand.last_action}</div>
                    <div className="admin-cell-subtitle">{formatDateTime(brand.last_action_at)}</div>
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button type="button" className="admin-action-btn ghost" onClick={() => setSelectedBrand(brand)}>
                        <Eye size={16} /> Review
                      </button>
                      <button type="button" className="admin-action-btn success" onClick={() => handleBrandDecision(brand.brand_id, "APPROVED")}>
                        <Check size={16} /> Approve
                      </button>
                      <button type="button" className="admin-action-btn danger" onClick={() => handleBrandDecision(brand.brand_id, "REJECTED")}>
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderRequestTab = () => (
    <div className="admin-tab-stack">
      <section className="admin-panel-card">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-kicker">Approval Requests</span>
            <h3>Product and batch change approvals</h3>
          </div>
        </div>
        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Requested by</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvalRequests.map((request) => (
                <tr key={request.approval_id}>
                  <td>
                    <div className="admin-cell-title">{request.approval_id}</div>
                    <div className="admin-cell-subtitle">{formatDateTime(request.created_at)}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{request.initiated_by_display}</div>
                    <div className="admin-cell-subtitle">{request.initiated_role}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{request.target_table}</div>
                    <div className="admin-cell-subtitle">{request.target_id}</div>
                  </td>
                  <td>
                    <div className="admin-clamp-text">{request.change_reason}</div>
                  </td>
                  <td>
                    <StatusPill value={request.status} />
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button type="button" className="admin-action-btn ghost" onClick={() => setSelectedRequest({ type: "approval", data: request })}>
                        <Eye size={16} /> Details
                      </button>
                      <button type="button" className="admin-action-btn success" onClick={() => handleApprovalDecision(request.approval_id, "APPROVED")}>
                        <Check size={16} /> Approve
                      </button>
                      <button type="button" className="admin-action-btn danger" onClick={() => handleApprovalDecision(request.approval_id, "REJECTED")}>
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel-card">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-kicker">QR Issuance</span>
            <h3>Brand QR generation requests</h3>
          </div>
        </div>
        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Brand / Batch</th>
                <th>Quantity</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {qrCodeRequests.map((request) => (
                <tr key={request.request_id}>
                  <td>
                    <div className="admin-cell-title">{request.request_id}</div>
                    <div className="admin-cell-subtitle">{formatDateTime(request.created_at)}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{request.brand_name}</div>
                    <div className="admin-cell-subtitle">
                      {request.product_name} / {request.batch_code}
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{request.requested_quantity.toLocaleString("en-US")} codes</div>
                    <div className="admin-cell-subtitle">{request.product_id}</div>
                  </td>
                  <td>
                    <StatusPill value={request.generation_method} />
                  </td>
                  <td>
                    <StatusPill value={request.status} />
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button type="button" className="admin-action-btn ghost" onClick={() => setSelectedRequest({ type: "qr-request", data: request })}>
                        <Eye size={16} /> Details
                      </button>
                      <button type="button" className="admin-action-btn success" onClick={() => handleQrRequestDecision(request.request_id, "APPROVED")}>
                        <Check size={16} /> Approve
                      </button>
                      <button type="button" className="admin-action-btn danger" onClick={() => handleQrRequestDecision(request.request_id, "REJECTED")}>
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderQrMonitoringTab = () => (
    <section className="admin-panel-card">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">QR Risk Control</span>
          <h3>Monitor the QR overview dataset</h3>
        </div>
        <div className="admin-filter-row">
          {["ALL", "SUSPICIOUS", "NEW", "ACTIVATED", "BLOCKED"].map((item) => (
            <button key={item} type="button" className={`admin-filter-chip ${qrFilter === item ? "active" : ""}`} onClick={() => setQrFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-mini-stats">
        <StatCard icon={TriangleAlert} title="Suspicious QR" value={suspiciousQrCount} detail="Repeated public scans that should be investigated first" tone="danger" />
        <StatCard icon={Waypoints} title="Total public scans" value={totalPublicScans} detail="Combined public scan count across the mock overview" tone="info" />
        <StatCard icon={BadgeCheck} title="Activated" value={qrOverviewRows.filter((item) => item.status === "ACTIVATED").length} detail="Codes that completed activation successfully" tone="success" />
      </div>

      <div className="admin-table-shell">
        <table className="admin-table">
          <thead>
            <tr>
              <th>QR Token</th>
              <th>Status</th>
              <th>Product / Batch</th>
              <th>Scan counters</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            {filteredQrRows.map((qr) => (
              <tr key={qr.qr_id}>
                <td>
                  <div className="admin-cell-title">{maskToken(qr.qr_public_token)}</div>
                  <div className="admin-cell-subtitle">{qr.source}</div>
                </td>
                <td>
                  <StatusPill value={qr.status} />
                </td>
                <td>
                  <div className="admin-cell-title">{qr.product_id}</div>
                  <div className="admin-cell-subtitle">{qr.batch_id}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{qr.total_public_scans} public scans</div>
                  <div className="admin-cell-subtitle">{qr.total_pin_attempts} pin attempts</div>
                </td>
                <td>
                  <div className="admin-cell-title">Created: {formatDateTime(qr.created_at)}</div>
                  <div className="admin-cell-subtitle">Activated: {formatDateTime(qr.activated_at)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSystemTab = () => (
    <section className="admin-panel-card">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">Live Sessions</span>
          <h3>Active devices across the system</h3>
        </div>
      </div>

      <div className="admin-mini-stats">
        <StatCard icon={Users} title="Total sessions" value={activeSessions.length} detail="Sessions that are not revoked and not expired yet" tone="neutral" />
        <StatCard icon={ShieldAlert} title="Admin sessions" value={activeAdminSessions} detail="High-privilege sessions that should be monitored closely" tone="info" />
        <StatCard icon={MonitorSmartphone} title="Mobile users" value={activeSessions.filter((item) => item.device_type === "mobile").length} detail="Active sessions from mobile devices" tone="success" />
      </div>

      <div className="admin-table-shell">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Device</th>
              <th>Location</th>
              <th>Last active</th>
              <th>Expires</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {activeSessions.map((session) => (
              <tr key={session.session_id}>
                <td>
                  <div className="admin-cell-title">{session.email}</div>
                  <div className="admin-cell-subtitle">{session.role}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{session.device_info}</div>
                  <div className="admin-cell-subtitle">{session.device_type}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{session.location_at_login}</div>
                  <div className="admin-cell-subtitle">{session.ip_at_login}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{formatDateTime(session.last_active_at)}</div>
                  <div className="admin-cell-subtitle">{formatDateTime(session.session_created)}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{formatDateTime(session.expires_at)}</div>
                  <div className="admin-cell-subtitle">{describeMinutesRemaining(session.minutes_until_expire)}</div>
                </td>
                <td>
                  <button type="button" className="admin-action-btn danger" onClick={() => handleRevokeSession(session.session_id)}>
                    <LogOut size={16} /> Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "requests":
        return renderRequestTab();
      case "monitoring":
        return renderQrMonitoringTab();
      case "system":
        return renderSystemTab();
      case "brands":
      default:
        return renderBrandTab();
    }
  };

  return (
    <main className="dashboard-main admin-dashboard">
      <div className="dashboard-layout admin-dashboard-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-top">
            <div className="admin-avatar-wrap">
              <img src={ADMIN_PROFILE.avatar} alt={ADMIN_PROFILE.fullName} className="admin-avatar" />
              <span className="admin-role-badge">{ADMIN_PROFILE.role}</span>
            </div>
            <h2>{ADMIN_PROFILE.fullName}</h2>
            <p>{ADMIN_PROFILE.email}</p>
          </div>

          <div className="admin-sidebar-block">
            <span className="admin-kicker">Control Room</span>
            <div className="admin-sidebar-item">
              <Clock3 size={16} /> {ADMIN_PROFILE.shift}
            </div>
            <div className="admin-sidebar-item">
              <ShieldAlert size={16} /> High privilege account
            </div>
            <div className="admin-sidebar-item">
              <Layers3 size={16} /> Schema target: ScriptDB2.sql
            </div>
          </div>

          <div className="admin-sidebar-grid">
            <div className="admin-side-metric">
              <span>{brandPendingReviews.length}</span>
              <small>Brand queue</small>
            </div>
            <div className="admin-side-metric">
              <span>{pendingApprovalCount}</span>
              <small>Open approvals</small>
            </div>
            <div className="admin-side-metric">
              <span>{suspiciousQrCount}</span>
              <small>Suspicious QR</small>
            </div>
            <div className="admin-side-metric">
              <span>{activeSessions.length}</span>
              <small>Live sessions</small>
            </div>
          </div>
        </aside>

        <section className="dashboard-content admin-content-panel">
          <div className="admin-hero">
            <div>
              <span className="admin-kicker">Admin Command Center</span>
              <h1>Control approvals, QR risk, and active system sessions</h1>
              <p>This page uses mock data that closely maps to the current MySQL views so the workflow can be reviewed before live axios integration.</p>
            </div>
            <div className="admin-hero-alert">
              <FileWarning size={18} />
              <span>{activityBanner}</span>
            </div>
          </div>

          <div className="admin-overview-grid">
            <StatCard icon={CheckSquare} title="Brands to review" value={brandPendingReviews.length} detail="Source: v_admin_brand_pending_review" tone="warning" />
            <StatCard icon={ListTodo} title="Open requests" value={pendingApprovalCount} detail="approval_requests + qr_code_requests" tone="info" />
            <StatCard icon={TriangleAlert} title="QR alerts" value={suspiciousQrCount} detail="v_admin_qr_overview highlights suspicious codes" tone="danger" />
            <StatCard icon={Users} title="Active sessions" value={activeSessions.length} detail="Source: v_active_sessions" tone="neutral" />
          </div>

          <div className="tab-nav admin-tab-nav">
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} type="button" className={`tab-btn ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="tab-body admin-tab-body">{renderActiveTab()}</div>
        </section>
      </div>

      {selectedBrand ? (
        <DetailModal title={selectedBrand.brand_name} subtitle={`${selectedBrand.verification_status} / ${selectedBrand.brand_id}`} onClose={() => setSelectedBrand(null)}>
          <div className="admin-detail-grid">
            <div className="admin-detail-card">
              <span>Industry</span>
              <strong>{selectedBrand.industry}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Tax ID</span>
              <strong>{selectedBrand.tax_id}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Website</span>
              <strong>{selectedBrand.website}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Registered</span>
              <strong>{formatDateTime(selectedBrand.account_registered_at)}</strong>
            </div>
          </div>
          <div className="admin-detail-note">
            <h4>Latest review note</h4>
            <p>{selectedBrand.last_note}</p>
          </div>
        </DetailModal>
      ) : null}

      {selectedRequest ? (
        <DetailModal title={selectedRequest.type === "approval" ? selectedRequest.data.approval_id : selectedRequest.data.request_id} subtitle={selectedRequest.type === "approval" ? "Approval Request Snapshot" : "QR Code Request Snapshot"} onClose={() => setSelectedRequest(null)}>
          {selectedRequest.type === "approval" ? (
            <div className="admin-json-grid">
              <div className="admin-json-card">
                <h4>Original data</h4>
                <pre>{JSON.stringify(selectedRequest.data.original_data, null, 2)}</pre>
              </div>
              <div className="admin-json-card">
                <h4>Proposed changes</h4>
                <pre>{JSON.stringify(selectedRequest.data.proposed_changes, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="admin-detail-grid">
              <div className="admin-detail-card">
                <span>Brand</span>
                <strong>{selectedRequest.data.brand_name}</strong>
              </div>
              <div className="admin-detail-card">
                <span>Product</span>
                <strong>{selectedRequest.data.product_name}</strong>
              </div>
              <div className="admin-detail-card">
                <span>Batch</span>
                <strong>{selectedRequest.data.batch_code}</strong>
              </div>
              <div className="admin-detail-card">
                <span>Output file</span>
                <strong>{selectedRequest.data.output_file_url || "Not generated yet"}</strong>
              </div>
              <div className="admin-detail-card wide">
                <span>Brand note</span>
                <strong>{selectedRequest.data.brand_note}</strong>
              </div>
              <div className="admin-detail-card wide">
                <span>Admin note</span>
                <strong>{selectedRequest.data.admin_note || "Not processed yet"}</strong>
              </div>
            </div>
          )}
        </DetailModal>
      ) : null}
    </main>
  );
}
