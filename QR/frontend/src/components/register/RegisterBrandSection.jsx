import { Briefcase, UploadCloud } from "lucide-react";
import FileUploadZone from "../common/FileUploadZone";

export default function RegisterBrandSection({
  formData,
  fileInputRef,
  isDragging,
  onChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onRemoveFile,
}) {
  return (
    <div className="form-section fade-in">
      <h4 className="section-heading">
        <Briefcase size={16} /> Brand Details
      </h4>
      <div className="input-grid">
        <div className="input-group">
          <label>Brand Name *</label>
          <input type="text" name="brandName" required placeholder="Vinamilk, Nike..." value={formData.brandName} onChange={onChange} />
        </div>
        <div className="input-group">
          <label>Tax ID *</label>
          <input type="text" name="taxId" required placeholder="Business Tax Code" value={formData.taxId} onChange={onChange} />
        </div>

        <div className="input-group full-width">
          <label>Product Categories</label>
          <input type="text" name="productCategories" placeholder="e.g. Milk, Shoes, Electronics..." value={formData.productCategories} onChange={onChange} />
        </div>

        <div className="input-group">
          <label>Industry</label>
          <select name="industry" value={formData.industry} onChange={onChange}>
            <option value="">Select industry...</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Fashion & Apparel">Fashion & Apparel</option>
            <option value="Electronics">Electronics</option>
            <option value="Health & Beauty">Health & Beauty</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="input-group">
          <label>Website</label>
          <input type="url" name="website" placeholder="https://..." value={formData.website} onChange={onChange} />
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
      </div>
    </div>
  );
}
