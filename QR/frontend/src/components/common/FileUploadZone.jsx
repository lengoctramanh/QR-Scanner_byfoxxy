import { Paperclip, UploadCloud, X } from "lucide-react";

// Ham nay dung de render khu vuc upload file dung chung cho cac form.
// Nhan vao: props mo ta label, danh sach file, ref input va cac handler upload.
// Tra ve: JSX vung upload file va danh sach tep da chon.
export default function FileUploadZone({
  label,
  helperText,
  emptyLabel = "Drop files here or click to upload",
  accept,
  attachments = [],
  fileInputRef,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onRemoveFile,
  maxFiles = 10,
}) {
  return (
    <div className="input-group full-width">
      <label>{label}</label>

      <input type="file" multiple ref={fileInputRef} style={{ display: "none" }} onChange={onFileChange} accept={accept} />

      {attachments.length < maxFiles && (
        <div className={`file-upload-zone ${isDragging ? "dragging" : ""}`} onClick={() => fileInputRef.current?.click()} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          <UploadCloud size={28} className="upload-icon" />
          <span>{emptyLabel}</span>
          {helperText ? <small>{helperText}</small> : null}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="file-list-container">
          {attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-selected-box">
              <div className="file-info">
                <Paperclip size={14} className="file-icon" />
                <span className="file-name">{file.name}</span>
              </div>

              <button type="button" className="remove-file-btn" onClick={() => onRemoveFile(index)}>
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
