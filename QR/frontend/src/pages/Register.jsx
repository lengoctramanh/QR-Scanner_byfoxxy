import React, { useState, useRef } from "react";
import {
  QrCode,
  Menu,
  User,
  Building,
  Truck,
  Eye,
  EyeOff,
  ShieldCheck,
  UploadCloud,
  X,
  Paperclip,
} from "lucide-react";
import { Link } from "react-router-dom";
import "../assets/style.css";
import "./Register.css";

export default function Register() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("user");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    dob: "",
    gender: "",
    businessName: "",
    taxId: "",
    legalRep: "",
    hqAddress: "",
    website: "",
    industry: "",
    description: "",
    supplierType: "company",
    serviceTypes: [],
    region: "",
    scale: "",
    attachments: [],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(value)
        ? prev.serviceTypes.filter((t) => t !== value)
        : [...prev.serviceTypes, value],
    }));
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setFormData((prev) => ({ ...prev, attachments: [] }));
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
      alert("Một số file bị bỏ qua vì định dạng không được hỗ trợ!");
    }

    if (validFiles.length > 0) {
      setFormData((prev) => {
        const newAttachments = [...prev.attachments, ...validFiles];
        if (newAttachments.length > 10) {
          alert("Bạn chỉ được tải lên tối đa 10 file tài liệu.");
          return { ...prev, attachments: newAttachments.slice(0, 10) };
        }
        return { ...prev, attachments: newAttachments };
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => processFiles(Array.from(e.target.files));

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
    processFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (
      (role === "brand" || role === "supplier") &&
      formData.attachments.length === 0
    ) {
      alert(
        "Vui lòng tải lên ít nhất 1 file tài liệu minh chứng (Giấy phép / Hợp đồng)!",
      );
      return;
    }

    try {
      const payload = { ...formData, role: role };
      delete payload.attachments;

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert("🎉 Đăng ký thành công! Dữ liệu đã vào MySQL.");

        setFormData({
          emailOrPhone: "",
          password: "",
          confirmPassword: "",
          fullName: "",
          dob: "",
          gender: "",
          businessName: "",
          taxId: "",
          legalRep: "",
          hqAddress: "",
          website: "",
          industry: "",
          description: "",
          supplierType: "company",
          serviceTypes: [],
          region: "",
          scale: "",
          attachments: [],
        });
        e.target.reset();

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        alert("❌ Lỗi: " + data.message);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      alert("Không thể kết nối đến Server Backend!");
    }
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
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </div>
          </div>
        </header>

        <main className="register-main">
          <div className="register-card">
            <div className="reg-header">
              <h2>Create an Account</h2>
              <p>
                Join our platform to start scanning, managing, or distributing
                QR codes.
              </p>
            </div>

            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${role === "user" ? "active" : ""}`}
                onClick={() => handleRoleChange("user")}
              >
                <User size={18} /> Normal User
              </button>
              <button
                type="button"
                className={`role-btn ${role === "brand" ? "active" : ""}`}
                onClick={() => handleRoleChange("brand")}
              >
                <Building size={18} /> Brand / Business
              </button>
              <button
                type="button"
                className={`role-btn ${role === "supplier" ? "active" : ""}`}
                onClick={() => handleRoleChange("supplier")}
              >
                <Truck size={18} /> Supplier / Partner
              </button>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h4 className="section-heading">
                  <ShieldCheck size={16} /> Basic Information
                </h4>
                <div className="input-grid">
                  <div className="input-group">
                    <label>Full Name / Representative Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="John Doe"
                      value={formData.fullName} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Email or Phone Number *</label>
                    <input
                      type="text"
                      name="emailOrPhone"
                      required
                      placeholder="email@example.com"
                      value={formData.emailOrPhone} 
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Password *</label>
                    <div className="pw-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password} 
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="toggle-pw-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Confirm Password *</label>
                    <div className="pw-input-wrap">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword} 
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="toggle-pw-btn"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {role === "user" && (
                <div className="form-section fade-in">
                  <h4 className="section-heading">
                    <User size={16} /> Additional Info (Optional)
                  </h4>
                  <div className="input-grid">
                    <div className="input-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label>Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        {" "}
                        <option value="">Select gender...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {role === "brand" && (
                <div className="form-section fade-in">
                  <h4 className="section-heading">
                    <Building size={16} /> Business & Legal Information
                  </h4>
                  <div className="input-grid">
                    <div className="input-group">
                      <label>Registered Business Name *</label>
                      <input
                        type="text"
                        name="businessName"
                        required
                        placeholder="Acme Corp"
                        value={formData.businessName} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label>Tax ID (Mã số thuế) *</label>
                      <input
                        type="text"
                        name="taxId"
                        required
                        placeholder="0123456789"
                        value={formData.taxId} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group full-width">
                      <label>Headquarters Address *</label>
                      <input
                        type="text"
                        name="hqAddress"
                        required
                        placeholder="123 Main St, City, Country"
                        value={formData.hqAddress} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label>Industry / Sector *</label>
                      <select
                        name="industry"
                        required
                        value={formData.industry}
                        onChange={handleChange}
                      >
                        {" "}
                   
                        <option value="">Select industry...</option>
                        <option value="fnb">Food & Beverage</option>
                        <option value="fashion">Fashion & Apparel</option>
                        <option value="electronics">Electronics</option>
                        <option value="health">Health & Beauty</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Website (Optional)</label>
                      <input
                        type="url"
                        name="website"
                        placeholder="https://..."
                        value={formData.website}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group full-width">
                      <label>
                        <UploadCloud
                          size={16}
                          style={{
                            marginRight: "5px",
                            verticalAlign: "middle",
                          }}
                        />
                        Upload Business License / Documents (
                        {formData.attachments.length}/10) *
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
                          <small>
                            Supported formats: PDF, Word, Excel, PNG, JPG
                          </small>
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
                    </div>
                  </div>
                </div>
              )}

              {role === "supplier" && (
                <div className="form-section fade-in">
                  <h4 className="section-heading">
                    <Truck size={16} /> Provider Details
                  </h4>
                  <div className="input-grid">
                    <div className="input-group">
                      <label>Entity Type *</label>
                      <select
                        name="supplierType"
                        required
                        value={formData.supplierType}
                        onChange={handleChange}
                      >
                        {" "}

                        <option value="company">Registered Company</option>
                        <option value="individual">
                          Individual / Freelancer
                        </option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Tax ID (Optional)</label>
                      <input
                        type="text"
                        name="taxId"
                        placeholder="If applicable"
                        value={formData.taxId} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label>Operating Region *</label>
                      <input
                        type="text"
                        name="region"
                        required
                        placeholder="e.g. North America, Global"
                        value={formData.region} 
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label>Business Scale</label>
                      <select
                        name="scale"
                        value={formData.scale}
                        onChange={handleChange}
                      >
                        {" "}

                        <option value="">Select scale...</option>
                        <option value="small">Small (1-10 employees)</option>
                        <option value="medium">Medium (11-50 employees)</option>
                        <option value="large">Large (50+ employees)</option>
                      </select>
                    </div>
                    <div className="input-group full-width">
                      <label>Services Provided (Select multiple) *</label>
                      <div className="checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            value="marketing"
                            checked={formData.serviceTypes.includes(
                              "marketing",
                            )}
                            onChange={handleServiceChange}
                          />{" "}
                          Marketing Agency
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            value="distributor"
                            checked={formData.serviceTypes.includes(
                              "distributor",
                            )} 
                            onChange={handleServiceChange}
                          />{" "}
                          Wholesale Distributor
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            value="logistics"
                            checked={formData.serviceTypes.includes(
                              "logistics",
                            )} 
                            onChange={handleServiceChange}
                          />{" "}
                          Logistics & Delivery
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            value="kol"
                            checked={formData.serviceTypes.includes(
                              "kol",
                            )} 
                            onChange={handleServiceChange}
                          />{" "}
                          KOL / Affiliate
                        </label>
                      </div>
                    </div>
                    <div
                      className="input-group full-width"
                      style={{ marginTop: "10px" }}
                    >
                      <label>
                        <UploadCloud
                          size={16}
                          style={{
                            marginRight: "5px",
                            verticalAlign: "middle",
                          }}
                        />
                        Upload Proof of Business / Contracts (
                        {formData.attachments.length}/10) *
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
                          <small>
                            Supported formats: PDF, Word, Excel, PNG, JPG
                          </small>
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
                    </div>
                  </div>
                </div>
              )}

              <div className="policy-check">
                <label>
                  <input type="checkbox" required />I agree to the{" "}
                  <a href="#">Terms of Service</a> and{" "}
                  <a href="#">Privacy Policy</a>.
                </label>
              </div>

              <button type="submit" className="submit-reg-btn">
                CREATE ACCOUNT
              </button>

              <div className="login-prompt">
                Already have an account? <Link to="/login">Sign In here</Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
