import { Briefcase, UploadCloud } from "lucide-react";
import FileUploadZone from "../common/FileUploadZone";
import FieldFeedbackMessage from "../common/FieldFeedbackMessage";

// Ham nay dung de render nhom truong thong tin rieng cho tai khoan brand.
// Nhan vao: formData, ref input file va cac handler lien quan den upload va thay doi du lieu.
// Tra ve: JSX phan thong tin thuong hieu va tai lieu xac minh.
export default function RegisterBrandSection({ formData, errors, fileInputRef, isDragging, onChange, onDragOver, onDragLeave, onDrop, onFileChange, onRemoveFile }) {
  return (
    <div className="form-section fade-in">
      <h4 className="section-heading">
        <Briefcase size={16} /> Brand Details
      </h4>
      <div className="input-grid">
        <div className="input-group">
          <label>Brand Name *</label>
          <input type="text" name="brandName" required placeholder="Vinamilk, Nike..." value={formData.brandName} onChange={onChange} />
          <FieldFeedbackMessage message={errors.brandName} />
        </div>
        <div className="input-group">
          <label>Tax ID *</label>
          <input type="text" name="taxId" required placeholder="Business Tax Code" value={formData.taxId} onChange={onChange} />
          <FieldFeedbackMessage message={errors.taxId} />
        </div>

        <div className="input-group full-width">
          <label>Product Categories *</label>
          <input type="text" name="productCategories" placeholder="e.g. Milk, Shoes, Electronics..." value={formData.productCategories} onChange={onChange} />
          <FieldFeedbackMessage message={errors.productCategories} />
        </div>

        <div className="input-group">
          <label>Industry *</label>
          <input type="text" name="industry" placeholder="Food & Beverage" value={formData.industry} onChange={onChange} />
          <FieldFeedbackMessage message={errors.industry} />
        </div>
        <div className="input-group">
          <label>Website</label>
          <input type="url" name="website" placeholder="https://..." value={formData.website} onChange={onChange} />
          <FieldFeedbackMessage message={errors.website} />
        </div>

        <FileUploadZone
          label={
            <>
              <UploadCloud size={16} style={{ marginRight: "5px", verticalAlign: "middle" }} />
              Verification Documents ({formData.attachments.length}/10) *
            </>
          }
          helperText="Supported formats: PDF, Word, Excel, PNG, JPG"
          emptyLabel="Click or drag & drop documents for verification"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          attachments={formData.attachments}
          fileInputRef={fileInputRef}
          isDragging={isDragging}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
        />
        <FieldFeedbackMessage message={errors.attachments} />
      </div>
    </div>
  );
}
