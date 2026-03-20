import { CheckSquare, Eye, Layers3, ListTodo, LogOut, MonitorSmartphone, ShieldAlert, TriangleAlert, Users, Waypoints } from "lucide-react";
import AdminBrandRequestModal from "../components/admin/AdminBrandRequestModal";
import AdminBrandReviewPanel from "../components/admin/AdminBrandReviewPanel";
import { DetailModal, StatCard, StatusPill } from "../components/admin/AdminDashboardShared";
import defaultAvatar from "../assets/image.png";
import { TAB_ITEMS } from "../data/adminDashboardData";
import useAdminDashboard from "../hooks/useAdminDashboard";
import { describeMinutesRemaining, formatDateTime, formatGenderLabel, maskToken } from "../utils/adminDashboardUtils";
import "./AdminDashboard.css";
import "./UserDashboard.css";

// Ham nay dung de render bang dieu khien admin va ket noi giao dien voi hook du lieu live cho brand reviews.
// Nhan vao: khong nhan props, du lieu duoc lay tu useAdminDashboard.
// Tra ve: giao dien dashboard admin voi tab review live va cac khu vuc giam sat.
export default function AdminDashboard() {
  const {
    activeAdminSessions,
    activeBrandActionId,
    activeSessions,
    activeTab,
    activityBanner,
    adminProfile,
    approvalRequests,
    closeBrandReview,
    filteredQrRows,
    handleApprovalDecision,
    handleApproveBrandRequest,
    handleQrRequestDecision,
    handleRejectBrandRequest,
    handleRevokeSession,
    isBrandDetailLoading,
    isBrandQueueLoading,
    openBrandReview,
    pendingApprovalCount,
    qrCodeRequests,
    qrFilter,
    qrOverviewRows,
    selectedBrandRequestDetail,
    selectedRequest,
    setActiveTab,
    setQrFilter,
    setSelectedRequest,
    sortedBrandRequests,
    suspiciousQrCount,
    totalPublicScans,
  } = useAdminDashboard();

  // Ham nay dung de render tab tong hop cac approval request va QR issuance request.
  // Nhan vao: khong nhan tham so, doc du lieu mock tu hook admin.
  // Tra ve: JSX chua hai bang request de admin theo doi.
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
              {approvalRequests.map((requestRow) => (
                <tr key={requestRow.approval_id}>
                  <td>
                    <div className="admin-cell-title">{requestRow.approval_id}</div>
                    <div className="admin-cell-subtitle">{formatDateTime(requestRow.created_at)}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{requestRow.initiated_by_display}</div>
                    <div className="admin-cell-subtitle">{requestRow.initiated_role}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{requestRow.target_table}</div>
                    <div className="admin-cell-subtitle">{requestRow.target_id}</div>
                  </td>
                  <td>
                    <div className="admin-clamp-text">{requestRow.change_reason}</div>
                  </td>
                  <td>
                    <StatusPill value={requestRow.status} />
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button type="button" className="admin-action-btn ghost" onClick={() => setSelectedRequest({ type: "approval", data: requestRow })}>
                        <Eye size={16} /> Details
                      </button>
                      <button type="button" className="admin-action-btn success" onClick={() => handleApprovalDecision(requestRow.approval_id, "APPROVED")}>
                        Approve
                      </button>
                      <button type="button" className="admin-action-btn danger" onClick={() => handleApprovalDecision(requestRow.approval_id, "REJECTED")}>
                        Reject
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
              {qrCodeRequests.map((requestRow) => (
                <tr key={requestRow.request_id}>
                  <td>
                    <div className="admin-cell-title">{requestRow.request_id}</div>
                    <div className="admin-cell-subtitle">{formatDateTime(requestRow.created_at)}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{requestRow.brand_name}</div>
                    <div className="admin-cell-subtitle">
                      {requestRow.product_name} / {requestRow.batch_code}
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{requestRow.requested_quantity.toLocaleString("en-US")} codes</div>
                    <div className="admin-cell-subtitle">{requestRow.product_id}</div>
                  </td>
                  <td>
                    <StatusPill value={requestRow.generation_method} />
                  </td>
                  <td>
                    <StatusPill value={requestRow.status} />
                  </td>
                  <td>
                    <div className="admin-action-row">
                      <button type="button" className="admin-action-btn ghost" onClick={() => setSelectedRequest({ type: "qr-request", data: requestRow })}>
                        <Eye size={16} /> Details
                      </button>
                      <button type="button" className="admin-action-btn success" onClick={() => handleQrRequestDecision(requestRow.request_id, "APPROVED")}>
                        Approve
                      </button>
                      <button type="button" className="admin-action-btn danger" onClick={() => handleQrRequestDecision(requestRow.request_id, "REJECTED")}>
                        Reject
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

  // Ham nay dung de render tab giam sat tong quan QR theo bo loc trang thai.
  // Nhan vao: khong nhan tham so, doc qrFilter va filteredQrRows tu hook.
  // Tra ve: JSX hien thi thong ke va bang overview cua QR.
  const renderQrMonitoringTab = () => (
    <section className="admin-panel-card">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">QR Risk Control</span>
          <h3>Monitor the QR overview dataset</h3>
        </div>
        <div className="admin-filter-row">
          {["ALL", "SUSPICIOUS", "NEW", "ACTIVATED", "BLOCKED"].map((filterValue) => (
            <button key={filterValue} type="button" className={`admin-filter-chip ${qrFilter === filterValue ? "active" : ""}`} onClick={() => setQrFilter(filterValue)}>
              {filterValue}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-mini-stats">
        <StatCard icon={TriangleAlert} title="Suspicious QR" value={suspiciousQrCount} detail="Repeated public scans that should be investigated first" tone="danger" />
        <StatCard icon={Waypoints} title="Total public scans" value={totalPublicScans} detail="Combined public scan count across the current overview" tone="info" />
        <StatCard icon={CheckSquare} title="Activated" value={qrOverviewRows.filter((item) => item.status === "ACTIVATED").length} detail="Codes that completed activation successfully" tone="success" />
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
            {filteredQrRows.map((qrRow) => (
              <tr key={qrRow.qr_id}>
                <td>
                  <div className="admin-cell-title">{maskToken(qrRow.qr_public_token)}</div>
                  <div className="admin-cell-subtitle">{qrRow.source}</div>
                </td>
                <td>
                  <StatusPill value={qrRow.status} />
                </td>
                <td>
                  <div className="admin-cell-title">{qrRow.product_id}</div>
                  <div className="admin-cell-subtitle">{qrRow.batch_id}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{qrRow.total_public_scans} public scans</div>
                  <div className="admin-cell-subtitle">{qrRow.total_pin_attempts} pin attempts</div>
                </td>
                <td>
                  <div className="admin-cell-title">Created: {formatDateTime(qrRow.created_at)}</div>
                  <div className="admin-cell-subtitle">Activated: {formatDateTime(qrRow.activated_at)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  // Ham nay dung de render tab theo doi session dang hoat dong trong he thong.
  // Nhan vao: khong nhan tham so, doc activeSessions va cac so lieu tinh san.
  // Tra ve: JSX cua bang session va cac the thong ke he thong.
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
            {activeSessions.map((sessionRow) => (
              <tr key={sessionRow.session_id}>
                <td>
                  <div className="admin-cell-title">{sessionRow.email}</div>
                  <div className="admin-cell-subtitle">{sessionRow.role}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{sessionRow.device_info}</div>
                  <div className="admin-cell-subtitle">{sessionRow.device_type}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{sessionRow.location_at_login}</div>
                  <div className="admin-cell-subtitle">{sessionRow.ip_at_login}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{formatDateTime(sessionRow.last_active_at)}</div>
                  <div className="admin-cell-subtitle">{formatDateTime(sessionRow.session_created)}</div>
                </td>
                <td>
                  <div className="admin-cell-title">{formatDateTime(sessionRow.expires_at)}</div>
                  <div className="admin-cell-subtitle">{describeMinutesRemaining(sessionRow.minutes_until_expire)}</div>
                </td>
                <td>
                  <button type="button" className="admin-action-btn danger" onClick={() => handleRevokeSession(sessionRow.session_id)}>
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

  // Ham nay dung de chon tab admin dang hoat dong va tra ve giao dien phu hop.
  // Nhan vao: khong nhan tham so, dua vao gia tri activeTab tu hook.
  // Tra ve: JSX cua tab hien tai tren dashboard admin.
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
        return (
          <AdminBrandReviewPanel
            rows={sortedBrandRequests}
            isLoading={isBrandQueueLoading}
            activeActionRequestId={activeBrandActionId}
            onReview={openBrandReview}
            onApprove={handleApproveBrandRequest}
            onReject={handleRejectBrandRequest}
          />
        );
    }
  };

  const sidebarAvatar = adminProfile.avatarUrl || defaultAvatar;

  return (
    <main className="dashboard-main admin-dashboard">
      <div className="dashboard-layout admin-dashboard-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-top">
            <div className="admin-avatar-wrap">
              <img
                src={sidebarAvatar}
                alt={adminProfile.fullName}
                className="admin-avatar"
                onError={(event) => {
                  event.currentTarget.src = defaultAvatar;
                }}
              />
              <span className="admin-role-badge">{adminProfile.role === "admin" ? "Admin" : adminProfile.role}</span>
            </div>
            <h2>{adminProfile.fullName}</h2>
            <p>{adminProfile.email || "No email available"}</p>
          </div>

          <div className="admin-sidebar-block">
            <span className="admin-kicker">Control Room</span>
            <div className="admin-sidebar-item">
              <ShieldAlert size={16} /> High privilege account
            </div>
            <div className="admin-sidebar-item">
              <Users size={16} /> Gender: {formatGenderLabel(adminProfile.gender)}
            </div>
            <div className="admin-sidebar-item">
              <Layers3 size={16} /> Last sign-in: {formatDateTime(adminProfile.lastLoginAt)}
            </div>
          </div>

          <div className="admin-sidebar-grid">
            <div className="admin-side-metric">
              <span>{sortedBrandRequests.length}</span>
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
              <p>{activityBanner}</p>
            </div>
          </div>

          <div className="admin-overview-grid">
            <StatCard icon={CheckSquare} title="Brands to review" value={sortedBrandRequests.length} detail="Live queue from brand_registration_requests" tone="warning" />
            <StatCard icon={ListTodo} title="Open requests" value={pendingApprovalCount} detail="approval_requests + qr_code_requests" tone="info" />
            <StatCard icon={TriangleAlert} title="QR alerts" value={suspiciousQrCount} detail="Current suspicious QR overview" tone="danger" />
            <StatCard icon={Users} title="Active sessions" value={activeSessions.length} detail="Current active session snapshot" tone="neutral" />
          </div>

          <div className="tab-nav admin-tab-nav">
            {TAB_ITEMS.map((tabItem) => {
              const Icon = tabItem.icon;
              return (
                <button key={tabItem.key} type="button" className={`tab-btn ${activeTab === tabItem.key ? "active" : ""}`} onClick={() => setActiveTab(tabItem.key)}>
                  <Icon size={18} /> {tabItem.label}
                </button>
              );
            })}
          </div>

          <div className="tab-body admin-tab-body">{renderActiveTab()}</div>
        </section>
      </div>

      <AdminBrandRequestModal
        requestDetail={selectedBrandRequestDetail}
        isLoading={isBrandDetailLoading}
        activeActionRequestId={activeBrandActionId}
        onClose={closeBrandReview}
        onApprove={handleApproveBrandRequest}
        onReject={handleRejectBrandRequest}
      />

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
