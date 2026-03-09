import React, { useState, useRef } from "react";
import {
  QrCode,
  Menu,
  Lightbulb,
  Send,
  User,
  Calendar,
  Building,
  MessageSquare,
  CheckCircle,
  Paperclip,
  X,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";
import "../assets/style.css";
import "./Suggestion.css";

export default function Suggestion() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    contributorName: "",
    dob: "",
    companyName: "",
    details: "",
    attachments: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const name =
      formData.contributorName.trim() === ""
        ? "Valued Contributor"
        : formData.contributorName;
    console.log("Feedback Sent from:", name, formData);
    setSubmitted(true);
  };

  const handleDateSelect = (e) => {
    const rawDate = e.target.value;
    if (rawDate) {
      const [year, month, day] = rawDate.split("-");
      setFormData({ ...formData, dob: `${day}/${month}/${year}` });
    }
  };

  const processFiles = (filesArray) => {
    if (filesArray.length === 0) return;

    const validExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".png",
      ".jpg",
      ".jpeg",
    ];
    const validFiles = filesArray.filter((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length !== filesArray.length) {
      alert("Some files were skipped because their format is not supported.");
    }

    if (validFiles.length > 0) {
      setFormData((prev) => {
        const newAttachments = [...prev.attachments, ...validFiles];
        if (newAttachments.length > 10) {
          alert("You can only upload a maximum of 10 files.");
          return { ...prev, attachments: newAttachments.slice(0, 10) };
        }
        return { ...prev, attachments: newAttachments };
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const removeFile = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  };

  return (
    <div className="page-container">
      <div className="main-panel">
        <header className="top-bar">
          <div className="logo-area">
            <QrCode className="qr-svg" color="white" />
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => setOpen(false)}
            >
              <span className="logo-text text-white ms-2">QR CODE</span>
            </Link>
          </div>

          <div className="menu-area">
            <button className="menu-btn" onClick={() => setOpen((v) => !v)}>
              <Menu className="menu-svg" color="white" />
            </button>
            <div className={`dropdown-menu ${open ? "show" : ""}`}>
              <Link to="/" onClick={() => setOpen(false)}>
                Home
              </Link>
              <Link to="/about" onClick={() => setOpen(false)}>
                About
              </Link>
              <Link to="/code" onClick={() => setOpen(false)}>
                Code
              </Link>
            </div>
          </div>
        </header>

        <main className="suggestion-main">
          <div className="page-title-area">
            <h1 className="page-title">
              <Lightbulb className="title-icon-main" /> SUGGESTION
            </h1>
            <div className="title-divider"></div>
          </div>

          <div className="suggestion-layout">
            <div
              className={`appreciation-card ${submitted ? "success-mode" : ""}`}
            >
              {!submitted ? (
                <div className="appreciation-content">
                  <h3>We value your voice!</h3>
                  <p>
                    Your ideas drive our innovation. Every proposal is a step
                    toward a better experience for everyone.
                  </p>
                  <div className="appreciation-decor"></div>
                </div>
              ) : (
                <div className="success-message-box">
                  <CheckCircle size={60} className="success-icon" />
                  <h2>Thank You!</h2>
                  <p>
                    We appreciate your feedback! Your proposal has been received
                    and will be carefully reviewed by our team.
                  </p>
                  <div className="action-buttons-group">
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          contributorName: "",
                          dob: "",
                          companyName: "",
                          details: "",
                          attachments: [],
                        });
                      }}
                    >
                      Send another feedback
                    </button>
                    <Link to="/" className="btn-home">
                      Back to Home
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className={`form-container ${submitted ? "form-hidden" : ""}`}>
              <form onSubmit={handleSubmit} className="suggestion-form">
                <div className="form-group">
                  <label>
                    <User size={16} /> Contributor Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Anonymous"
                    value={formData.contributorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contributorName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Calendar size={16} /> Date of Birth{" "}
                    <span className="required">*</span>
                  </label>
                  <div className="date-input-wrap">
                    <input
                      type="text"
                      required
                      placeholder="dd/mm/yyyy"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                    />
                    <div className="calendar-picker-trigger">
                      <Calendar size={20} className="cal-icon" />
                      <input
                        type="date"
                        className="hidden-date-input"
                        onChange={handleDateSelect}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <Building size={16} /> Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    <MessageSquare size={16} /> Proposal/Contribution Details{" "}
                    <span className="required">*</span>
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Tell us what you are thinking..."
                    value={formData.details}
                    onChange={(e) =>
                      setFormData({ ...formData, details: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>
                    <Paperclip size={16} /> Attachments (
                    {formData.attachments.length}/10)
                  </label>

                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />

                  {formData.attachments.length < 10 && (
                    <div
                      className={`file-upload-zone ${isDragging ? "dragging" : ""}`}
                      onClick={() => fileInputRef.current.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <UploadCloud size={28} className="upload-icon" />
                      <span>Click to upload or drag & drop files here</span>
                    </div>
                  )}

                  {formData.attachments.length > 0 && (
                    <div className="file-list-container">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="file-selected-box">
                          <div className="file-info">
                            <Paperclip size={14} className="file-icon" />
                            <span className="file-name">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => removeFile(index)}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <small>
                    Supported formats: PDF, Word, Excel, PNG, JPG (Max 10
                    files).
                  </small>
                </div>

                <button
                  type="submit"
                  className="send-btn"
                  style={{ marginTop: "10px" }}
                >
                  <Send size={18} /> SEND PROPOSAL
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
