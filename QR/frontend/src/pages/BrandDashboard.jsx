import { BrandDashboardContent, BrandDashboardSidebar } from "../components/dashboard/BrandDashboardSections";
import useBrandDashboard from "../hooks/useBrandDashboard";
import "./BrandDashboard.css";
import "./UserDashboard.css";

export default function BrandDashboard() {
  const {
    activeTab,
    brandInfo,
    excelFile,
    excelInputRef,
    handleExcelChange,
    handleExcelDragLeave,
    handleExcelDragOver,
    handleExcelDrop,
    handleExcelSubmit,
    handleLogoChange,
    handleManualQrSubmit,
    handleSettingsSubmit,
    isDragging,
    logoInputRef,
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
        <BrandDashboardSidebar brandInfo={brandInfo} logoInputRef={logoInputRef} onLogoChange={handleLogoChange} />
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
