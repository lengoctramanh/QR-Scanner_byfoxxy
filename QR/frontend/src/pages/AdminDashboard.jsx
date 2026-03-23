import {
  Building2,
  CheckSquare,
  Globe,
  Layers3,
  Link2,
  LogOut,
  MonitorSmartphone,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react";
import AdminBrandRequestModal from "../components/admin/AdminBrandRequestModal";
import AdminBrandReviewPanel from "../components/admin/AdminBrandReviewPanel";
import {
  DetailModal,
  EmptyState,
  StatCard,
  StatusPill,
} from "../components/admin/AdminDashboardShared";
import AdminWebsiteQrPanel from "../components/admin/AdminWebsiteQrPanel";
import defaultAvatar from "../assets/image.png";
import { TAB_ITEMS } from "../data/adminDashboardData";
import useAdminDashboard from "../hooks/useAdminDashboard";
import {
  describeMinutesRemaining,
  formatDateTime,
  formatGenderLabel,
  formatStatusLabel,
} from "../utils/adminDashboardUtils";
import "./AdminDashboard.css";
import "./UserDashboard.css";

// Ham nay dung de render mot bang detail cho modal thong ke user/brand/admin.
// Nhan vao: columns la cau hinh cot va rows la du lieu can hien thi.
// Tra ve: JSX bang hoac empty state neu khong co du lieu.
function AdminSummaryTable({ columns, rows, emptyTitle, emptyDescription }) {
  if (!rows.length) {
    return <EmptyState icon={Users} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="admin-table-shell">
      <table className="admin-table admin-summary-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row.fullName || row.brandName || "row"}-${rowIndex}`}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Ham nay dung de render dashboard admin va ket noi giao dien voi hook du lieu live.
// Nhan vao: khong nhan props, du lieu duoc lay tu useAdminDashboard.
// Tra ve: giao dien dashboard admin voi tab website QR, review brand va system sessions that.
export default function AdminDashboard() {
  const {
    activeBrandActionId,
    activeSessionActionId,
    activeSessions,
    activeTab,
    activityBanner,
    adminProfile,
    closeBrandReview,
    closeSystemPanel,
    handleApproveBrandRequest,
    handleRejectBrandRequest,
    handleRevokeSession,
    handleSaveWebsiteQr,
    handleWebsiteUrlDraftChange,
    isBrandDetailLoading,
    isBrandQueueLoading,
    isSystemLoading,
    isWebsiteQrLoading,
    isWebsiteQrSaving,
    openBrandReview,
    openSystemPanel,
    selectedBrandRequestDetail,
    selectedSystemPanel,
    setActiveTab,
    sortedBrandRequests,
    totalAdmins,
    totalBrands,
    totalActiveSessions,
    totalUsers,
    systemAdmins,
    systemBrands,
    systemUsers,
    websiteQrCurrent,
    websiteQrHistory,
    websiteQrUrlDraft,
    websiteQrVersionCount,
  } = useAdminDashboard();

  // Ham nay dung de render tab quan ly URL website chinh va QR tuong ung cho admin.
  // Nhan vao: khong nhan tham so, doc state va handlers tu useAdminDashboard.
  // Tra ve: JSX panel nhap URL, preview QR va lich su phien ban.
  const renderWebsiteTab = () => (
    <AdminWebsiteQrPanel
      currentConfig={websiteQrCurrent}
      history={websiteQrHistory}
      websiteUrl={websiteQrUrlDraft}
      onWebsiteUrlChange={handleWebsiteUrlDraftChange}
      onSave={handleSaveWebsiteQr}
      isLoading={isWebsiteQrLoading}
      isSaving={isWebsiteQrSaving}
    />
  );

  // Ham nay dung de render tab he thong gom tong quan role va cac session dang song.
  // Nhan vao: khong nhan tham so, doc du lieu tu hook admin.
  // Tra ve: JSX summary + bang session live + nut mo modal chi tiet.
  const renderSystemTab = () => (
    <section className="admin-panel-card">
      <div className="admin-panel-heading">
        <div>
          <span className="admin-kicker">System Session</span>
          <h3>Live accounts and session control</h3>
        </div>
      </div>

      <div className="admin-mini-stats">
        <button
          type="button"
          className="admin-stat-button"
          onClick={() => openSystemPanel("users")}
        >
          <StatCard
            icon={Users}
            title="Total users"
            value={totalUsers}
            detail="Click to review names, status, and last sign-in only"
            tone="info"
          />
        </button>
        <button
          type="button"
          className="admin-stat-button"
          onClick={() => openSystemPanel("brands")}
        >
          <StatCard
            icon={Building2}
            title="Total brands"
            value={totalBrands}
            detail="Click to review basic business data, tax ID, and email"
            tone="warning"
          />
        </button>
        <button
          type="button"
          className="admin-stat-button"
          onClick={() => openSystemPanel("admins")}
        >
          <StatCard
            icon={UserCog}
            title="Total admins"
            value={totalAdmins}
            detail="Click to review privileged accounts and last sign-in"
            tone="neutral"
          />
        </button>
      </div>

      {isSystemLoading ? (
        <EmptyState
          icon={MonitorSmartphone}
          title="Loading live system data"
          description="Please wait while the admin dashboard pulls session and account snapshots from the database."
        />
      ) : activeSessions.length > 0 ? (
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
                    <div className="admin-cell-title">{sessionRow.full_name}</div>
                    <div className="admin-cell-subtitle">
                      {sessionRow.email} / {sessionRow.role}
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{sessionRow.device_info}</div>
                    <div className="admin-cell-subtitle">
                      {formatStatusLabel(sessionRow.device_type || "unknown")}
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-title">{sessionRow.location_at_login}</div>
                    <div className="admin-cell-subtitle">{sessionRow.ip_at_login}</div>
                  </td>
                  <td>
                    <div className="admin-cell-title">
                      {formatDateTime(sessionRow.last_active_at)}
                    </div>
                    <div className="admin-cell-subtitle">
                      Created: {formatDateTime(sessionRow.session_created)}
                    </div>
                  </td>
                  <td>
                    <div className="admin-cell-title">
                      {formatDateTime(sessionRow.expires_at)}
                    </div>
                    <div className="admin-cell-subtitle">
                      {describeMinutesRemaining(sessionRow.minutes_until_expire)}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-action-btn danger"
                      onClick={() => handleRevokeSession(sessionRow.session_id)}
                      disabled={activeSessionActionId === sessionRow.session_id}
                    >
                      <LogOut size={16} />
                      {activeSessionActionId === sessionRow.session_id
                        ? "Revoking..."
                        : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={MonitorSmartphone}
          title="No active sessions"
          description="There are currently no live sessions in the database snapshot."
        />
      )}
    </section>
  );

  // Ham nay dung de chon tab admin dang hoat dong va tra ve giao dien phu hop.
  // Nhan vao: khong nhan tham so, dua vao gia tri activeTab tu hook.
  // Tra ve: JSX cua tab hien tai tren dashboard admin.
  const renderActiveTab = () => {
    switch (activeTab) {
      case "website":
        return renderWebsiteTab();
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

  const summaryModalConfig =
    selectedSystemPanel === "users"
      ? {
          title: "Registered Users",
          subtitle:
            "This list intentionally hides email, phone, and internal IDs as requested.",
          columns: [
            {
              key: "fullName",
              label: "Name",
              render: (row) => <div className="admin-cell-title">{row.fullName}</div>,
            },
            {
              key: "gender",
              label: "Gender",
              render: (row) => (
                <div className="admin-cell-subtitle">{formatGenderLabel(row.gender)}</div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusPill value={row.status} />,
            },
            {
              key: "lastLoginAt",
              label: "Last Sign-In",
              render: (row) => (
                <div className="admin-cell-subtitle">{formatDateTime(row.lastLoginAt)}</div>
              ),
            },
          ],
          rows: systemUsers,
          emptyTitle: "No users found",
          emptyDescription: "The database does not contain any user accounts yet.",
        }
      : selectedSystemPanel === "brands"
        ? {
            title: "Registered Brands",
            subtitle: "Brand owners, tax IDs, and business emails pulled from the database.",
            columns: [
              {
                key: "brandName",
                label: "Brand",
                render: (row) => (
                  <>
                    <div className="admin-cell-title">{row.brandName}</div>
                    <div className="admin-cell-subtitle">{row.ownerName}</div>
                  </>
                ),
              },
              {
                key: "taxId",
                label: "Tax ID",
                render: (row) => <div className="admin-cell-subtitle">{row.taxId}</div>,
              },
              {
                key: "email",
                label: "Email",
                render: (row) => <div className="admin-cell-subtitle">{row.email}</div>,
              },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <div className="admin-summary-stack">
                    <StatusPill value={row.status} />
                    <span className="admin-cell-subtitle">
                      {row.verified ? "Verified" : formatStatusLabel(row.verificationStatus)}
                    </span>
                  </div>
                ),
              },
            ],
            rows: systemBrands,
            emptyTitle: "No brands found",
            emptyDescription: "The database does not contain any approved brand accounts yet.",
          }
        : selectedSystemPanel === "admins"
          ? {
              title: "Administrator Accounts",
              subtitle: "High-privilege accounts currently stored in the database.",
              columns: [
                {
                  key: "fullName",
                  label: "Name",
                  render: (row) => <div className="admin-cell-title">{row.fullName}</div>,
                },
                {
                  key: "gender",
                  label: "Gender",
                  render: (row) => (
                    <div className="admin-cell-subtitle">{formatGenderLabel(row.gender)}</div>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => <StatusPill value={row.status} />,
                },
                {
                  key: "lastLoginAt",
                  label: "Last Sign-In",
                  render: (row) => (
                    <div className="admin-cell-subtitle">{formatDateTime(row.lastLoginAt)}</div>
                  ),
                },
              ],
              rows: systemAdmins,
              emptyTitle: "No admins found",
              emptyDescription: "There are currently no administrator accounts in the database.",
            }
          : null;

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
              <span className="admin-role-badge">
                {adminProfile.role === "admin" ? "Admin" : adminProfile.role}
              </span>
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
            <div className="admin-sidebar-item">
              <Link2 size={16} /> Website QR:{" "}
              {websiteQrCurrent
                ? `Version ${websiteQrCurrent.changeNumber}`
                : "Not configured"}
            </div>
          </div>

          <div className="admin-sidebar-grid">
            <div className="admin-side-metric">
              <span>{sortedBrandRequests.length}</span>
              <small>Brand queue</small>
            </div>
            <div className="admin-side-metric">
              <span>{websiteQrVersionCount}</span>
              <small>URL QR versions</small>
            </div>
            <div className="admin-side-metric">
              <span>{totalUsers}</span>
              <small>Registered users</small>
            </div>
            <div className="admin-side-metric">
              <span>{totalActiveSessions}</span>
              <small>Live sessions</small>
            </div>
          </div>
        </aside>

        <section className="dashboard-content admin-content-panel">
          <div className="admin-hero">
            <div>
              <span className="admin-kicker">Admin Command Center</span>
              <h1>Control brand reviews, website QR, and live system health</h1>
              <p>{activityBanner}</p>
            </div>
          </div>

          <div className="admin-overview-grid">
            <StatCard
              icon={CheckSquare}
              title="Brands to review"
              value={sortedBrandRequests.length}
              detail="Live queue from brand_registration_requests"
              tone="warning"
            />
            <StatCard
              icon={Globe}
              title="Website QR versions"
              value={websiteQrVersionCount}
              detail="Saved versions from website_qr_configs"
              tone="info"
            />
            <StatCard
              icon={Users}
              title="Total users"
              value={totalUsers}
              detail="Registered user accounts from the database"
              tone="success"
            />
            <StatCard
              icon={MonitorSmartphone}
              title="Active sessions"
              value={totalActiveSessions}
              detail="Current active session snapshot"
              tone="neutral"
            />
          </div>

          <div className="tab-nav admin-tab-nav">
            {TAB_ITEMS.map((tabItem) => {
              const Icon = tabItem.icon;
              return (
                <button
                  key={tabItem.key}
                  type="button"
                  className={`tab-btn ${activeTab === tabItem.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tabItem.key)}
                >
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

      {summaryModalConfig ? (
        <DetailModal
          title={summaryModalConfig.title}
          subtitle={summaryModalConfig.subtitle}
          onClose={closeSystemPanel}
        >
          <AdminSummaryTable
            columns={summaryModalConfig.columns}
            rows={summaryModalConfig.rows}
            emptyTitle={summaryModalConfig.emptyTitle}
            emptyDescription={summaryModalConfig.emptyDescription}
          />
        </DetailModal>
      ) : null}
    </main>
  );
}
