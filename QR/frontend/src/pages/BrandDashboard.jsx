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
    activeExportBatchId,
    avatarFileName,
    avatarInputRef,
    brandInfo,
    brandProducts,
    excelFile,
    excelInputRef,
    handleAvatarChange,
    handleAvatarDragLeave,
    handleAvatarDragOver,
    handleAvatarDrop,
    handleBatchExport,
    handleExcelChange,
    handleExcelDragLeave,
    handleExcelDragOver,
    handleExcelDrop,
    handleExcelSubmit,
    handleLogoChange,
    handleLogoDragLeave,
    handleLogoDragOver,
    handleLogoDrop,
    handleManualQrSubmit,
    handleSettingsSubmit,
    handleTemplateDownload,
    isDragging,
    isAvatarDragging,
    isBatchUploading,
    isLogoDragging,
    isProductSaving,
    isProfileSaving,
    isTemplateDownloading,
    latestIssuedQrAssets,
    logoFileName,
    logoInputRef,
    productFeedback,
    profileFeedback,
    qrForm,
    setActiveTab,
    setBrandInfoField,
    setExcelFile,
    setQrFormField,
  } = useBrandDashboard();

  return (
    <main className="dashboard-main">
      <div className="dashboard-layout">
        <BrandDashboardSidebar brandInfo={brandInfo} avatarInputRef={avatarInputRef} onAvatarChange={handleAvatarChange} />
        <BrandDashboardContent
          activeTab={activeTab}
          avatarFileName={avatarFileName}
          avatarInputRef={avatarInputRef}
          brandInfo={brandInfo}
          brandProducts={brandProducts}
          activeExportBatchId={activeExportBatchId}
          excelFile={excelFile}
          excelInputRef={excelInputRef}
          isDragging={isDragging}
          isAvatarDragging={isAvatarDragging}
          isBatchUploading={isBatchUploading}
          isLogoDragging={isLogoDragging}
          isProductSaving={isProductSaving}
          isProfileSaving={isProfileSaving}
          isTemplateDownloading={isTemplateDownloading}
          latestIssuedQrAssets={latestIssuedQrAssets}
          logoFileName={logoFileName}
          logoInputRef={logoInputRef}
          productFeedback={productFeedback}
          profileFeedback={profileFeedback}
          qrForm={qrForm}
          onBrandInfoChange={setBrandInfoField}
          onAvatarChange={handleAvatarChange}
          onAvatarDrop={handleAvatarDrop}
          onAvatarDragLeave={handleAvatarDragLeave}
          onAvatarDragOver={handleAvatarDragOver}
          onBatchExport={handleBatchExport}
          onExcelChange={handleExcelChange}
          onExcelDragLeave={handleExcelDragLeave}
          onExcelDragOver={handleExcelDragOver}
          onExcelDrop={handleExcelDrop}
          onExcelRemove={() => setExcelFile(null)}
          onExcelSubmit={handleExcelSubmit}
          onLogoChange={handleLogoChange}
          onLogoDrop={handleLogoDrop}
          onLogoDragLeave={handleLogoDragLeave}
          onLogoDragOver={handleLogoDragOver}
          onManualQrSubmit={handleManualQrSubmit}
          onQrFormChange={setQrFormField}
          onSettingsSubmit={handleSettingsSubmit}
          onTemplateDownload={handleTemplateDownload}
          onTabChange={setActiveTab}
        />
      </div>
    </main>
  );
}
