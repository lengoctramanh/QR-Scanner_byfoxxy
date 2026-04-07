import { Building2, Globe, Mail, MapPin, Phone, ReceiptText, Save } from "lucide-react";
import ProfileMediaDropzone from "./ProfileMediaDropzone";

// Ham nay dung de render form business profile cua brand, gom text fields va 2 o upload avatar/logo.
// Nhan vao: brandInfo, drag state, feedback va cac handler cap nhat/submit tu hook dashboard brand.
// Tra ve: JSX form de luu business profile ma khong anh huong card doi mat khau o ben duoi.
export default function BrandProfileSettings({
  brandInfo,
  avatarInputRef,
  logoInputRef,
  avatarFileName,
  logoFileName,
  isAvatarDragging,
  isLogoDragging,
  isSubmitting,
  feedback,
  onFieldChange,
  onSubmit,
  onAvatarChange,
  onLogoChange,
  onAvatarDrop,
  onLogoDrop,
  onAvatarDragLeave,
  onLogoDragLeave,
  onAvatarDragOver,
  onLogoDragOver,
}) {
  return (
    <form className="profile-card profile-card-wide" onSubmit={onSubmit}>
      <div className="profile-card-header">
        <div className="profile-card-icon">
          <Building2 size={18} />
        </div>
        <div>
          <h3>Business Profile</h3>
          <p>Save your company details here. Avatar and brand logo can be uploaded by click or drag and drop.</p>
        </div>
      </div>

      <div className="profile-form-grid profile-form-grid-brand">
        <div className="input-group">
          <label htmlFor="brand-business-name">Business Name</label>
          <input id="brand-business-name" type="text" value={brandInfo.businessName} onChange={(event) => onFieldChange("businessName", event.target.value)} className="profile-input" placeholder="Your business name" />
        </div>

        <div className="input-group">
          <label htmlFor="brand-email">Contact Email</label>
          <div className="profile-input-shell">
            <Mail size={16} />
            <input id="brand-email" type="email" value={brandInfo.email} onChange={(event) => onFieldChange("email", event.target.value)} className="profile-input profile-input-plain" placeholder="name@company.com" />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="brand-phone">Phone Number</label>
          <div className="profile-input-shell">
            <Phone size={16} />
            <input id="brand-phone" type="text" value={brandInfo.phone} onChange={(event) => onFieldChange("phone", event.target.value)} className="profile-input profile-input-plain" placeholder="Add a phone number" />
          </div>
        </div>

        <div className="media-dropzone-grid media-dropzone-grid-inline">
          <ProfileMediaDropzone
            title="Avatar"
            description="Upload the account avatar."
            previewUrl={brandInfo.avatar}
            fileName={avatarFileName}
            isDragging={isAvatarDragging}
            inputRef={avatarInputRef}
            onChange={onAvatarChange}
            onDrop={onAvatarDrop}
            onDragLeave={onAvatarDragLeave}
            onDragOver={onAvatarDragOver}
          />

          <ProfileMediaDropzone
            title="Brand Logo"
            description="Upload the brand logo."
            previewUrl={brandInfo.logo}
            fileName={logoFileName}
            isDragging={isLogoDragging}
            inputRef={logoInputRef}
            onChange={onLogoChange}
            onDrop={onLogoDrop}
            onDragLeave={onLogoDragLeave}
            onDragOver={onLogoDragOver}
            buttonLabel="Choose Logo"
          />
        </div>

        <div className="input-group input-group-full">
          <label htmlFor="brand-address">Business Address</label>
          <div className="profile-input-shell profile-input-shell-multiline">
            <MapPin size={16} />
            <input id="brand-address" type="text" value={brandInfo.address} onChange={(event) => onFieldChange("address", event.target.value)} className="profile-input profile-input-plain" placeholder="Office or business address" />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="brand-website">Website</label>
          <div className="profile-input-shell">
            <Globe size={16} />
            <input id="brand-website" type="text" value={brandInfo.website} onChange={(event) => onFieldChange("website", event.target.value)} className="profile-input profile-input-plain" placeholder="https://your-company.com" />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="brand-tax-id">Tax ID</label>
          <div className="profile-input-shell">
            <ReceiptText size={16} />
            <input id="brand-tax-id" type="text" value={brandInfo.taxId} onChange={(event) => onFieldChange("taxId", event.target.value)} className="profile-input profile-input-plain" placeholder="Business tax ID" />
          </div>
        </div>
      </div>

      {feedback.message ? <div className={`profile-feedback ${feedback.type}`}>{feedback.message}</div> : null}

      <div className="profile-card-actions">
        <button type="submit" className="save-btn profile-save-btn" disabled={isSubmitting}>
          <Save size={16} />
          {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </form>
  );
}
