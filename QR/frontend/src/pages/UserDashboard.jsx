import { UserDashboardContent, UserDashboardSidebar, UserScanDetailsModal } from "../components/dashboard/UserDashboardSections";
import useUserDashboard from "../hooks/useUserDashboard";
import "./UserDashboard.css";

// Ham nay dung de render dashboard cua user thuong va noi state tu hook vao cac section UI.
// Nhan vao: khong nhan props, su dung du lieu va handler tu useUserDashboard.
// Tra ve: giao dien dashboard user kem modal chi tiet lan quet.
export default function UserDashboard() {
  const { activeScans, activeTab, closeScanDetails, fileInputRef, handleAvatarChange, handleSaveSettings, openScanDetails, scanHistoryData, selectedScan, setActiveTab, userInfo } = useUserDashboard();

  return (
    <main className="dashboard-main">
      <div className="dashboard-layout">
        <UserDashboardSidebar userInfo={userInfo} fileInputRef={fileInputRef} onAvatarChange={handleAvatarChange} />
        <UserDashboardContent activeTab={activeTab} scanHistoryData={scanHistoryData} activeScans={activeScans} onOpenScanDetails={openScanDetails} onSaveSettings={handleSaveSettings} onTabChange={setActiveTab} />
      </div>

      <UserScanDetailsModal scan={selectedScan} onClose={closeScanDetails} />
    </main>
  );
}
