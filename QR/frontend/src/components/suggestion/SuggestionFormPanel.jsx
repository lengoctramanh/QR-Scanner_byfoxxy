import { Building, Calendar, MessageSquare, Paperclip, Send, User } from "lucide-react";
import FileUploadZone from "../common/FileUploadZone";

export default function SuggestionFormPanel({
  submitted,
  formData,
  fileInputRef,
  isDragging,
  onChange,
  onDateSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onRemoveFile,
  onSubmit,
}) {
  return (
    <div className={`form-container ${submitted ? "form-hidden" : ""}`}>
      <form onSubmit={onSubmit} className="suggestion-form">
        <div className="form-group">
          <label>
            <User size={16} /> Contributor Name (Optional)
          </label>
          <input type="text" name="contributorName" placeholder="Anonymous" value={formData.contributorName} onChange={onChange} />
        </div>

        <div className="form-group">
          <label>
            <Calendar size={16} /> Date of Birth <span className="required">*</span>
          </label>
          <div className="date-input-wrap">
            <input type="text" name="dob" required placeholder="dd/mm/yyyy" value={formData.dob} onChange={onChange} />
            <div className="calendar-picker-trigger">
              <Calendar size={20} className="cal-icon" />
              <input type="date" className="hidden-date-input" onChange={onDateSelect} />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>
            <Building size={16} /> Company Name (Optional)
          </label>
          <input type="text" name="companyName" placeholder="Enter company name" value={formData.companyName} onChange={onChange} />
        </div>

        <div className="form-group">
          <label>
            <MessageSquare size={16} /> Proposal/Contribution Details <span className="required">*</span>
          </label>
          <textarea required rows="4" name="details" placeholder="Tell us what you are thinking..." value={formData.details} onChange={onChange}></textarea>
        </div>

        <div className="form-group">
          <FileUploadZone
            label={
              <>
                <Paperclip size={16} /> Attachments ({formData.attachments.length}/10)
              </>
            }
            helperText="Supported formats: PDF, Word, Excel, PNG, JPG (Max 10 files)."
            emptyLabel="Click to upload or drag & drop files here"
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

        <button type="submit" className="send-btn" style={{ marginTop: "10px" }}>
          <Send size={18} /> SEND PROPOSAL
        </button>
      </form>
    </div>
  );
}
