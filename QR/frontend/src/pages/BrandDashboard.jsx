import { BrandDashboardContent, BrandDashboardSidebar } from "../components/dashboard/BrandDashboardSections";
import useBrandDashboard from "../hooks/useBrandDashboard";
import "./BrandDashboard.css";
import "./UserDashboard.css";

// Ham nay dung de render dashboard cua brand va truyen logic tu hook vao cac khu vuc quan tri.
// Nhan vao: khong nhan props, su dung state/handler tu useBrandDashboard.
// Tra ve: giao dien dashboard brand cho thong tin, QR va cai dat.
export default function BrandDashboard() {
  const {
    activeTab,
    avatarInputRef,
    brandInfo,
    excelFile,
    excelInputRef,
    handleAvatarChange,
    handleExcelChange,
    handleExcelDragLeave,
    handleExcelDragOver,
    handleExcelDrop,
    handleExcelSubmit,
    handleManualQrSubmit,
    handleSettingsSubmit,
    isDragging,
    passwords,
    qrForm,
    setActiveTab,
    setBrandInfoField,
    setExcelFile,
    setPasswordField,
    setQrFormField,
    showPasswords,
    togglePasswordVisibility,
    toggleSystemGenerated,
  } = useBrandDashboard();

  return (
    <main className="dashboard-main">
      <div className="dashboard-layout">
        <BrandDashboardSidebar brandInfo={brandInfo} avatarInputRef={avatarInputRef} onAvatarChange={handleAvatarChange} />
        <BrandDashboardContent
          activeTab={activeTab}
          brandInfo={brandInfo}
          excelFile={excelFile}
          excelInputRef={excelInputRef}
          isDragging={isDragging}
          passwords={passwords}
          qrForm={qrForm}
          showPasswords={showPasswords}
          onBrandInfoChange={setBrandInfoField}
          onExcelChange={handleExcelChange}
          onExcelDragLeave={handleExcelDragLeave}
          onExcelDragOver={handleExcelDragOver}
          onExcelDrop={handleExcelDrop}
          onExcelRemove={() => setExcelFile(null)}
          onExcelSubmit={handleExcelSubmit}
          onManualQrSubmit={handleManualQrSubmit}
          onPasswordChange={setPasswordField}
          onPasswordVisibilityToggle={togglePasswordVisibility}
          onQrFormChange={setQrFormField}
          onSettingsSubmit={handleSettingsSubmit}
          onSystemGeneratedToggle={toggleSystemGenerated}
          onTabChange={setActiveTab}
        />
      </div>
    </main>
  );
}
