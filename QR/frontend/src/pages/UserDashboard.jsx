import { UserConfirmActionModal, UserDashboardContent, UserDashboardSidebar, UserScanDetailsModal } from "../components/dashboard/UserDashboardSections";
import useUserDashboard from "../hooks/useUserDashboard";
import "./UserDashboard.css";

// Ham nay dung de render dashboard cua user thuong va noi state tu hook vao cac section UI.
// Nhan vao: khong nhan props, su dung du lieu va handler tu useUserDashboard.
// Tra ve: giao dien dashboard user kem modal chi tiet lan quet.
export default function UserDashboard() {
  const {
    activeScans,
    activeTab,
    avatarFileName,
    cancelDeleteHistory,
    claimFeedback,
    claimTokenValue,
    confirmDeleteHistory,
    closeScanDetails,
    dashboardMessage,
    fileInputRef,
    handleAvatarChange,
    handleAvatarDragLeave,
    handleAvatarDragOver,
    handleAvatarDrop,
    handleClaimTokenSubmit,
    handleClaimTokenValueChange,
    handleProfileFieldChange,
    handleSaveSettings,
    isAvatarDragging,
    isClaimingToken,
    isDashboardLoading,
    isDeletingHistory,
    isProfileSaving,
    openScanDetails,
    pendingDeleteHistoryId,
    profileFeedback,
    requestDeleteHistory,
    scanHistoryData,
    selectedScan,
    setActiveTab,
    userInfo,
  } = useUserDashboard();

  return (
    <main className="dashboard-main">
      <div className="dashboard-layout">
        <UserDashboardSidebar userInfo={userInfo} fileInputRef={fileInputRef} onAvatarChange={handleAvatarChange} />
        <UserDashboardContent
          activeTab={activeTab}
          scanHistoryData={scanHistoryData}
          activeScans={activeScans}
          claimFeedback={claimFeedback}
          claimTokenValue={claimTokenValue}
          dashboardMessage={dashboardMessage}
          isDashboardLoading={isDashboardLoading}
          isClaimingToken={isClaimingToken}
          onOpenScanDetails={openScanDetails}
          onClaimTokenInputChange={handleClaimTokenValueChange}
          onClaimTokenSubmit={handleClaimTokenSubmit}
          onDeleteHistoryRequest={requestDeleteHistory}
          onTabChange={setActiveTab}
          userInfo={userInfo}
          avatarInputRef={fileInputRef}
          avatarFileName={avatarFileName}
          isAvatarDragging={isAvatarDragging}
          isProfileSaving={isProfileSaving}
          profileFeedback={profileFeedback}
          onAvatarChange={handleAvatarChange}
          onAvatarDrop={handleAvatarDrop}
          onAvatarDragLeave={handleAvatarDragLeave}
          onAvatarDragOver={handleAvatarDragOver}
          onProfileFieldChange={handleProfileFieldChange}
          onProfileSubmit={handleSaveSettings}
        />
      </div>

      <UserScanDetailsModal scan={selectedScan} onClose={closeScanDetails} />
      <UserConfirmActionModal
        isOpen={Boolean(pendingDeleteHistoryId)}
        isSubmitting={isDeletingHistory}
        onClose={cancelDeleteHistory}
        onConfirm={confirmDeleteHistory}
      />
    </main>
  );
}
