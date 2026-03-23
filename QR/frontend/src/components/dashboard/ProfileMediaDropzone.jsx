import { ImagePlus, UploadCloud } from "lucide-react";

// Ham nay dung de render mot o upload anh ho tro click chon file va keo-tha.
// Nhan vao: cac props mo ta tieu de, preview, file name va handler onChange/drag-drop.
// Tra ve: JSX dropzone nho gon de dung cho avatar va logo trong settings.
export default function ProfileMediaDropzone({ title, description, previewUrl, fileName, isDragging, inputRef, onChange, onDrop, onDragLeave, onDragOver, buttonLabel = "Choose Image" }) {
  return (
    <div className="media-dropzone-card">
      <span className="media-dropzone-title">{title}</span>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChange} />

      <div className={`media-dropzone ${isDragging ? "dragging" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {previewUrl ? (
          <img src={previewUrl} alt={title} className="media-dropzone-preview" />
        ) : (
          <div className="media-dropzone-placeholder">
            <ImagePlus size={24} />
          </div>
        )}

        <div className="media-dropzone-copy">
          <span className="media-dropzone-button">
            <UploadCloud size={16} />
            {buttonLabel}
          </span>
          <small>{description}</small>
          {fileName ? <strong>{fileName}</strong> : null}
        </div>
      </div>
    </div>
  );
}
