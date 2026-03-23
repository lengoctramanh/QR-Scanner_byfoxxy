import { useState } from "react";
import {
  Camera,
  FileSpreadsheet,
  Globe,
  Mail,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  Save,
  Settings,
  ShieldCheck,
  Sticker,
  UploadCloud,
  X,
} from "lucide-react";
import BrandProfileSettings from "./BrandProfileSettings";
import ChangePassword from "./ChangePassword";
import DashboardTabNav from "./DashboardTabNav";
import defaultAvatar from "../../assets/image.png";

const DEFAULT_BRAND_LOGO = "/pictures/logo/logo1.png";

const BRAND_DASHBOARD_TABS = [
  { id: "manage", icon: Package, label: "Manage Products" },
  { id: "create", icon: PlusCircle, label: "Issue Authentication QR" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const INPUT_STYLE = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
};

// Ham nay dung de format ngay sang dang doc duoc tren giao dien tieng Anh.
// Nhan vao: value la chuoi ngay hoac Date.
// Tra ve: chuoi ngay da format hoac "Pending update" neu khong hop le.
const formatDateValue = (value) => {
  if (!value) {
    return "Pending update";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Pending update";
  }

  return parsedDate.toLocaleDateString("en-GB");
};

const formatDateTimeValue = (value) => {
  if (!value) {
    return "Not scanned yet";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not scanned yet";
  }

  return parsedDate.toLocaleString("en-GB");
};

const calculateRemainingDays = (expiryDate) => {
  if (!expiryDate) {
    return null;
  }

  const parsedExpiryDate = new Date(expiryDate);

  if (Number.isNaN(parsedExpiryDate.getTime())) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil((parsedExpiryDate.getTime() - Date.now()) / millisecondsPerDay);
  return diffDays;
};

const buildLatestAssetCards = (qrAssets = {}) => [
  {
    id: "web-link",
    title: "QR Web Link",
    description: qrAssets.webLink?.value || "Main website QR",
    imageUrl: qrAssets.webLink?.imageUrl || "",
  },
  {
    id: "qr-1",
    title: "QR 1",
    description: "Authentication QR",
    imageUrl: qrAssets.qr1?.imageUrl || "",
  },
];

const buildLabelAssetCards = (label) => [
  { id: "websiteQr", title: "QR Web Link", imageUrl: label?.assets?.websiteQr?.publicUrl || "" },
  { id: "qr1", title: "QR 1", imageUrl: label?.assets?.qr1?.publicUrl || "" },
];

function BatchInfoItem({ label, value }) {
  return (
    <div className="catalog-meta-item">
      <span className="catalog-meta-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function QrThumb({ imageUrl, title, className = "" }) {
  return imageUrl ? (
    <img src={imageUrl} alt={title} className={className} />
  ) : (
    <div className={`${className} qr-thumb-placeholder`}>
      <span>{title}</span>
    </div>
  );
}

// Ham nay dung de render sidebar thong tin thuong hieu trong dashboard brand.
// Nhan vao: brandInfo la du lieu brand, avatarInputRef la ref input avatar, onAvatarChange la ham doi avatar.
// Tra ve: JSX sidebar hien avatar tai khoan, logo thuong hieu va thong tin lien he cua brand.
export function BrandDashboardSidebar({ brandInfo, avatarInputRef, onAvatarChange }) {
  const displayName = brandInfo.fullName || "Pending update";
  const displayBusinessName = brandInfo.businessName || "Pending update";
  const displayTaxId = brandInfo.taxId || "Pending update";
  const displayEmail = brandInfo.email || "Pending update";
  const displayPhone = brandInfo.phone || "Pending update";
  const displayAddress = brandInfo.address || "Pending update";
  const displayWebsite = brandInfo.website || "Pending update";
  const resolvedAvatar = typeof brandInfo.avatar === "string" && brandInfo.avatar.trim() ? brandInfo.avatar : defaultAvatar;
  const resolvedBrandLogo = typeof brandInfo.logo === "string" && brandInfo.logo.trim() ? brandInfo.logo : DEFAULT_BRAND_LOGO;

  return (
    <aside className="brand-sidebar">
      <div className="brand-avatar-wrapper">
        <img
          src={resolvedAvatar}
          alt="Brand Avatar"
          className="brand-avatar-img"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = defaultAvatar;
          }}
        />
        <button type="button" className="upload-avatar-btn" onClick={() => avatarInputRef.current?.click()}>
          <Camera size={16} />
        </button>
        <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={onAvatarChange} />
      </div>

      <div className="user-sidebar-info" style={{ width: "100%" }}>
        <h3 className="user-name" style={{ color: "#3f78c9" }}>
          {displayName}
        </h3>
        <h3 className="user-name" style={{ color: "#3f78c9" }}>
          {displayBusinessName}
        </h3>
        <p className="user-username" style={{ textAlign: "center" }}>
          Tax ID: {displayTaxId}
        </p>

        <div className="brand-logo-showcase">
          <img
            src={resolvedBrandLogo}
            alt="Brand Logo"
            className="brand-logo-img"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = DEFAULT_BRAND_LOGO;
            }}
          />
        </div>

        <div className="user-info-list">
          <div className="info-item">
            <Mail size={16} className="icon" /> {displayEmail}
          </div>
          <div className="info-item">
            <Phone size={16} className="icon" /> {displayPhone}
          </div>
          <div className="info-item">
            <MapPin size={16} className="icon" /> {displayAddress}
          </div>
          <div className="info-item">
            <Globe size={16} className="icon" />{" "}
            {brandInfo.website ? (
              <a href={brandInfo.website} target="_blank" rel="noreferrer" style={{ color: "#475569" }}>
                {displayWebsite}
              </a>
            ) : (
              <span>{displayWebsite}</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Ham nay dung de render noi dung chinh cua dashboard brand theo tung tab.
// Nhan vao: toan bo state va handler duoc hook dashboard brand truyen xuong.
// Tra ve: JSX noi dung tab quan ly san pham, tao QR va cai dat.
export function BrandDashboardContent({
  activeTab,
  activeExportBatchId,
  brandInfo,
  avatarFileName,
  avatarInputRef,
  brandProducts,
  excelFile,
  excelInputRef,
  isBatchUploading,
  isDragging,
  isAvatarDragging,
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
  onBrandInfoChange,
  onAvatarChange,
  onAvatarDrop,
  onAvatarDragLeave,
  onAvatarDragOver,
  onBatchExport,
  onExcelChange,
  onExcelDragLeave,
  onExcelDragOver,
  onExcelDrop,
  onExcelRemove,
  onExcelSubmit,
  onLogoChange,
  onLogoDrop,
  onLogoDragLeave,
  onLogoDragOver,
  onManualQrSubmit,
  onQrFormChange,
  onSettingsSubmit,
  onTemplateDownload,
  onTabChange,
}) {
  return (
    <section className="dashboard-content">
      <DashboardTabNav items={BRAND_DASHBOARD_TABS} activeTab={activeTab} onChange={onTabChange} />

      <div className="tab-body">
        {activeTab === "manage" ? (
          <ManageProductsSection
            activeExportBatchId={activeExportBatchId}
            brandProducts={brandProducts}
            latestIssuedQrAssets={latestIssuedQrAssets}
            onBatchExport={onBatchExport}
          />
        ) : null}
        {activeTab === "create" ? (
          <IssueQrSection
            brandInfo={brandInfo}
            excelFile={excelFile}
            excelInputRef={excelInputRef}
            isBatchUploading={isBatchUploading}
            isDragging={isDragging}
            isProductSaving={isProductSaving}
            isTemplateDownloading={isTemplateDownloading}
            latestIssuedQrAssets={latestIssuedQrAssets}
            productFeedback={productFeedback}
            qrForm={qrForm}
            onExcelChange={onExcelChange}
            onExcelDragLeave={onExcelDragLeave}
            onExcelDragOver={onExcelDragOver}
            onExcelDrop={onExcelDrop}
            onExcelRemove={onExcelRemove}
            onExcelSubmit={onExcelSubmit}
            onManualQrSubmit={onManualQrSubmit}
            onQrFormChange={onQrFormChange}
            onTemplateDownload={onTemplateDownload}
          />
        ) : null}
        {activeTab === "settings" ? (
          <div className="settings-stack">
            <BrandProfileSettings
              brandInfo={brandInfo}
              avatarInputRef={avatarInputRef}
              logoInputRef={logoInputRef}
              avatarFileName={avatarFileName}
              logoFileName={logoFileName}
              isAvatarDragging={isAvatarDragging}
              isLogoDragging={isLogoDragging}
              isSubmitting={isProfileSaving}
              feedback={profileFeedback}
              onFieldChange={onBrandInfoChange}
              onSubmit={onSettingsSubmit}
              onAvatarChange={onAvatarChange}
              onLogoChange={onLogoChange}
              onAvatarDrop={onAvatarDrop}
              onLogoDrop={onLogoDrop}
              onAvatarDragLeave={onAvatarDragLeave}
              onLogoDragLeave={onLogoDragLeave}
              onAvatarDragOver={onAvatarDragOver}
              onLogoDragOver={onLogoDragOver}
            />

            <ChangePassword />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LatestIssuedQrPanel({ latestIssuedQrAssets }) {
  if (!latestIssuedQrAssets?.qrAssets) {
    return null;
  }

  const { product, qrAssets } = latestIssuedQrAssets;
  const assetCards = buildLatestAssetCards(qrAssets);

  return (
    <div className="qr-asset-panel">
      <div className="qr-asset-panel-header">
        <div>
          <h4>Latest Authentication Assets</h4>
          <p>Fresh previews from the newest batch so you can verify the main website QR and QR 1 immediately.</p>
        </div>
        {product?.productName ? <span className="catalog-badge">Product: {product.productName}</span> : null}
      </div>

      <div className="qr-asset-grid">
        {assetCards.map((assetCard) => (
          <article key={assetCard.id} className="qr-asset-card">
            <h5>{assetCard.title}</h5>
            <QrThumb imageUrl={assetCard.imageUrl} title={assetCard.title} className="qr-asset-image" />
            <code className="qr-token">{assetCard.description}</code>
          </article>
        ))}
      </div>
    </div>
  );
}

function LabelSticker({ label }) {
  const assetCards = buildLabelAssetCards(label);

  return (
    <article className="batch-label-sticker">
      <div className="batch-label-header">
        <strong>Label {String(label.sequenceNo).padStart(3, "0")}</strong>
        <span>{label.labelCode}</span>
      </div>

      <div className="batch-label-qr-grid">
        {assetCards.map((assetCard) => (
          <div key={`${label.labelId}-${assetCard.id}`} className="batch-label-qr-cell" title={assetCard.title}>
            <QrThumb imageUrl={assetCard.imageUrl} title={assetCard.title} className="batch-label-qr-image" />
          </div>
        ))}
      </div>
    </article>
  );
}

function BatchDetailModal({ batchDetail, activeExportBatchId, onBatchExport, onClose }) {
  if (!batchDetail) {
    return null;
  }

  const { batch, product } = batchDetail;
  const remainingDays = calculateRemainingDays(batch.expiryDate);

  return (
    <div className="batch-modal-overlay" onClick={onClose}>
      <div className="batch-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="batch-modal-header">
          <div>
            <h4>{batch.batchCode}</h4>
            <p>
              {product.brandName || "Pending brand"} | {product.productName}
            </p>
          </div>
          <button type="button" className="batch-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="catalog-meta-grid">
          <BatchInfoItem label="Brand" value={product.brandName || "Pending update"} />
          <BatchInfoItem label="Manufacturer" value={product.manufacturerName || "Pending update"} />
          <BatchInfoItem label="Created At" value={formatDateTimeValue(batch.createdAt)} />
          <BatchInfoItem label="Manufacture Date" value={formatDateValue(batch.manufactureDate)} />
          <BatchInfoItem label="Expiry Date" value={formatDateValue(batch.expiryDate)} />
          <BatchInfoItem label="Remaining Days" value={remainingDays == null ? "Pending update" : `${remainingDays} day(s)`} />
          <BatchInfoItem label="Issued Labels" value={String(batch.issueQuantity || 0)} />
          <BatchInfoItem label="Public Scans" value={String(batch.totalPublicScans || 0)} />
          <BatchInfoItem label="Secret Attempts" value={String(batch.totalPinAttempts || 0)} />
        </div>

        <div className="catalog-description-block">
          <span className="catalog-meta-label">Quality Certifications</span>
          <p>{product.qualityCertifications || "Pending update"}</p>
        </div>

        <div className="catalog-description-block">
          <span className="catalog-meta-label">Description</span>
          <p>{product.description || "No description yet."}</p>
        </div>

        <div className="catalog-card-footer">
          <div className="catalog-stat">
            <Sticker size={16} />
            <span>Website scans: {batch.totalPublicScans ?? 0}</span>
          </div>
          <div className="catalog-stat">
            <Package size={16} />
            <span>PIN attempts: {batch.totalPinAttempts ?? 0}</span>
          </div>
        </div>

        <div className="catalog-action-row">
          {product.generalInfoUrl ? (
            <a href={product.generalInfoUrl} target="_blank" rel="noreferrer" className="catalog-link">
              Open product information link
            </a>
          ) : (
            <span className="catalog-link disabled">No product information link</span>
          )}

          <button
            type="button"
            className="catalog-export-button"
            disabled={activeExportBatchId === batch.batchId}
            onClick={() => onBatchExport(batch.batchId)}>
            {activeExportBatchId === batch.batchId ? "EXPORTING..." : "Export ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageProductsSection({ activeExportBatchId, brandProducts, latestIssuedQrAssets, onBatchExport }) {
  const [selectedBatchDetail, setSelectedBatchDetail] = useState(null);

  return (
    <div className="catalog-section">
      <LatestIssuedQrPanel latestIssuedQrAssets={latestIssuedQrAssets} />

      <div className="catalog-section-header">
        <div>
          <h3>Issued Product Catalog</h3>
          <p>Each catalog opens into horizontal batch lanes, and every batch keeps the exact number of authentication labels requested by the brand.</p>
        </div>
        <span className="catalog-badge">{brandProducts.length} catalogs</span>
      </div>

      {brandProducts.length ? (
        <div className="catalog-product-stack">
          {brandProducts.map((product) => (
            <section key={product.productId} className="catalog-product-panel">
              <div className="catalog-product-header">
                <div>
                  <h4>{product.productName}</h4>
                  <p>
                    {product.brandName || "Pending brand"} | {product.manufacturerName || "Pending manufacturer"}
                  </p>
                </div>
                <span className="catalog-badge">{product.batchCount || 0} batches</span>
              </div>

              <div className="catalog-product-submeta">
                <span>{product.originCountry || "Pending origin"}</span>
                <span>{product.qualityCertifications || "No quality certifications yet."}</span>
              </div>

              {product.batches?.length ? (
                <div className="catalog-batch-row">
                  {product.batches.map((batch) => {
                    const remainingDays = calculateRemainingDays(batch.expiryDate);

                    return (
                      <article key={batch.batchId} className="catalog-batch-card">
                        <div className="catalog-card-header">
                          <div>
                            <h4>{batch.batchCode}</h4>
                            <p>{formatDateValue(batch.manufactureDate)} - {formatDateValue(batch.expiryDate)}</p>
                          </div>
                          <span className="catalog-badge">{batch.labelCount || 0} labels</span>
                        </div>

                        <div className="catalog-batch-summary">
                          <div className="catalog-stat">
                            <ShieldCheck size={16} />
                            <span>Created {formatDateTimeValue(batch.createdAt)}</span>
                          </div>
                          <div className="catalog-stat">
                            <Sticker size={16} />
                            <span>{remainingDays == null ? "Pending expiry" : `${remainingDays} day(s) left`}</span>
                          </div>
                        </div>

                        <div className="catalog-batch-label-scroll">
                          {batch.labels?.length ? (
                            batch.labels.map((label) => <LabelSticker key={label.labelId} label={label} />)
                          ) : (
                            <div className="catalog-empty-labels">No generated label images for this batch yet.</div>
                          )}
                        </div>

                        <div className="catalog-action-row">
                          <button
                            type="button"
                            className="catalog-detail-button"
                            onClick={() => setSelectedBatchDetail({ batch, product })}>
                            View Batch
                          </button>

                          <button
                            type="button"
                            className="catalog-export-button"
                            disabled={activeExportBatchId === batch.batchId}
                            onClick={() => onBatchExport(batch.batchId)}>
                            {activeExportBatchId === batch.batchId ? "EXPORTING..." : "Export ZIP"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-card">
                  <Package size={24} />
                  <h4>No batches yet</h4>
                  <p>Create or upload a batch in the Issue Authentication QR tab to populate this catalog.</p>
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <Package size={26} />
          <h4>No products issued yet</h4>
          <p>Create a product in the Issue Authentication QR tab to generate authentication labels for each batch.</p>
        </div>
      )}

      <BatchDetailModal
        batchDetail={selectedBatchDetail}
        activeExportBatchId={activeExportBatchId}
        onBatchExport={onBatchExport}
        onClose={() => setSelectedBatchDetail(null)}
      />
    </div>
  );
}

// Ham nay dung de render tab tao QR thu cong va upload batch Excel.
// Nhan vao: du lieu form QR, file Excel va cac handler xu ly upload/submit.
// Tra ve: JSX hai khu vuc tao QR thu cong va dang ky batch.
function IssueQrSection({
  brandInfo,
  excelFile,
  excelInputRef,
  isBatchUploading,
  isDragging,
  isProductSaving,
  isTemplateDownloading,
  latestIssuedQrAssets,
  productFeedback,
  qrForm,
  onExcelChange,
  onExcelDragLeave,
  onExcelDragOver,
  onExcelDrop,
  onExcelRemove,
  onExcelSubmit,
  onManualQrSubmit,
  onQrFormChange,
  onTemplateDownload,
}) {
  return (
    <div className="qr-creation-grid">
      <div className="creation-section">
        <h4 className="section-title">
          <Package size={20} color="#3f78c9" /> Manual Product Entry
        </h4>
        <form onSubmit={onManualQrSubmit}>
          <div className="creation-form-grid">
            <div className="input-group">
              <label>Product Name *</label>
              <input type="text" required placeholder="Example: ABC Facial Cleanser" value={qrForm.productName} onChange={(event) => onQrFormChange("productName", event.target.value)} className="input-wrap" style={INPUT_STYLE} />
            </div>

            <div className="input-group">
              <label>Brand</label>
              <div className="brand-readonly-shell">{brandInfo.businessName || "Pending update"}</div>
            </div>

            <div className="input-group">
              <label>Manufacturer *</label>
              <input type="text" required placeholder="Example: ABC Factory" value={qrForm.manufacturerName} onChange={(event) => onQrFormChange("manufacturerName", event.target.value)} style={INPUT_STYLE} />
            </div>

            <div className="input-group">
              <label>Country of Origin *</label>
              <input type="text" required placeholder="Example: Vietnam" value={qrForm.originCountry} onChange={(event) => onQrFormChange("originCountry", event.target.value)} style={INPUT_STYLE} />
            </div>

            <div className="input-group">
              <label>Manufacture Date *</label>
              <input type="date" required value={qrForm.manufactureDate} onChange={(event) => onQrFormChange("manufactureDate", event.target.value)} style={INPUT_STYLE} />
            </div>

            <div className="input-group">
              <label>Expiry Date *</label>
              <input type="date" required value={qrForm.expiryDate} onChange={(event) => onQrFormChange("expiryDate", event.target.value)} style={INPUT_STYLE} />
            </div>

            <div className="input-group">
              <label>General Info URL</label>
              <input type="url" placeholder="https://your-brand.com/product-details" value={qrForm.generalInfoUrl} onChange={(event) => onQrFormChange("generalInfoUrl", event.target.value)} style={INPUT_STYLE} />
            </div>

            <div className="input-group">
              <label>Suspicious Scan Limit</label>
              <input type="number" min="1" max="999999999" value={qrForm.scanLimit} onChange={(event) => onQrFormChange("scanLimit", event.target.value)} style={INPUT_STYLE} />
            </div>

            <div className="input-group">
              <label>Authentication Label Quantity *</label>
              <input type="number" min="1" max="500" value={qrForm.issueQuantity} onChange={(event) => onQrFormChange("issueQuantity", event.target.value)} style={INPUT_STYLE} />
            </div>

            <div className="input-group input-group-full">
              <label>Quality Certifications</label>
              <textarea rows="4" placeholder="Example: ISO 22000, GMP, HACCP" value={qrForm.qualityCertifications} onChange={(event) => onQrFormChange("qualityCertifications", event.target.value)} className="creation-textarea" />
            </div>

            <div className="input-group input-group-full">
              <label>Description</label>
              <textarea rows="4" placeholder="Short product summary shown after scanning." value={qrForm.description} onChange={(event) => onQrFormChange("description", event.target.value)} className="creation-textarea" />
            </div>
          </div>

          {productFeedback.message ? <div className={`profile-feedback ${productFeedback.type}`}>{productFeedback.message}</div> : null}

          <button type="submit" className="save-btn" style={{ width: "100%", marginTop: "20px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }} disabled={isProductSaving}>
            <Save size={16} />
            {isProductSaving ? "CREATING..." : "CREATE AUTHENTICATION QR BATCH"}
          </button>
        </form>

        <LatestIssuedQrPanel latestIssuedQrAssets={latestIssuedQrAssets} />
      </div>

      <div className="creation-section">
        <h4 className="section-title">
          <FileSpreadsheet size={20} color="#10b981" /> Batch Registration (Excel)
        </h4>
        <p
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginBottom: "20px",
          }}>
          Use a template file (.xlsx, .csv) with a large product list and matching QR values so the system can process everything in one batch.
        </p>

        <input type="file" accept=".xls,.xlsx,.csv" ref={excelInputRef} style={{ display: "none" }} onChange={onExcelChange} />

        {!excelFile ? (
          <div className={`excel-upload-zone ${isDragging ? "dragging" : ""}`} onClick={() => excelInputRef.current?.click()} onDragOver={onExcelDragOver} onDragLeave={onExcelDragLeave} onDrop={onExcelDrop}>
            <UploadCloud size={36} />
            <span>Drag your Excel file here or click to choose one</span>
            <small>Supported formats: .xls, .xlsx, .csv</small>
          </div>
        ) : (
          <div
            className="file-selected-box"
            style={{
              borderColor: "#10b981",
              background: "#f0fdf4",
              padding: "15px",
            }}>
            <div className="file-info">
              <FileSpreadsheet size={20} color="#10b981" className="file-icon" />
              <span className="file-name" style={{ color: "#059669", fontWeight: 700 }}>
                {excelFile.name}
              </span>
            </div>
            <button type="button" className="remove-file-btn" onClick={onExcelRemove}>
              <X size={20} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onExcelSubmit}
          className="save-btn"
          disabled={!excelFile || isBatchUploading}
          style={{
            width: "100%",
            marginTop: "20px",
            background: excelFile ? "linear-gradient(180deg, #34d399 0%, #10b981 100%)" : "#cbd5e1",
            boxShadow: "none",
          }}>
          {isBatchUploading ? "UPLOADING..." : "UPLOAD AND PROCESS BATCH"}
        </button>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <button
            type="button"
            onClick={onTemplateDownload}
            disabled={isTemplateDownloading}
            style={{
              color: "#3f78c9",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "underline",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}>
            {isTemplateDownloading ? "Downloading template..." : "Download the Excel Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
