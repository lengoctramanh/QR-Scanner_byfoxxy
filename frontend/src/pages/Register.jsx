import React, { useState } from "react";
import {
  QrCode,
  Menu,
  User,
  Building,
  Truck,
  Mail,
  Lock,
  Phone,
  UploadCloud,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import "../assets/style.css";
import "./Register.css";

export default function Register() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("user");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData, 
          role: role,  
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("🎉 Đăng ký thành công thật rồi nha! Dữ liệu đã vào MySQL.");
        console.log("Dữ liệu trả về:", data);
      } else {
        alert("❌ Lỗi: " + data.message);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      alert(
        "Không thể kết nối đến Server Backend. Đảm bảo cổng 5000 đang chạy!",
      );
    }
  };

  return (
    <div className="page-container">
      <div className="main-panel">
        <header className="top-bar">
          <div className="logo-area">
            <QrCode className="qr-svg" color="white" />
            <span className="logo-text text-white ms-2">QR CODE</span>
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
                onClick={() => setRole("user")}
              >
                <User size={18} /> Normal User
              </button>
              <button
                type="button"
                className={`role-btn ${role === "brand" ? "active" : ""}`}
                onClick={() => setRole("brand")}
              >
                <Building size={18} /> Brand / Business
              </button>
              <button
                type="button"
                className={`role-btn ${role === "supplier" ? "active" : ""}`}
                onClick={() => setRole("supplier")}
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
                      <input type="date" name="dob" onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Gender</label>
                      <select name="gender" onChange={handleChange}>
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
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label>Industry / Sector *</label>
                      <select name="industry" required onChange={handleChange}>
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
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group full-width file-upload-box">
                      <label>
                        <UploadCloud size={16} /> Upload Business License
                        (PDF/JPG) *
                      </label>
                      <input type="file" required accept=".pdf, .jpg, .png" />
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
                        onChange={handleChange}
                      >
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
                        onChange={handleChange}
                      />
                    </div>
                    <div className="input-group">
                      <label>Business Scale</label>
                      <select name="scale" onChange={handleChange}>
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
                            onChange={handleServiceChange}
                          />{" "}
                          Marketing Agency
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            value="distributor"
                            onChange={handleServiceChange}
                          />{" "}
                          Wholesale Distributor
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            value="logistics"
                            onChange={handleServiceChange}
                          />{" "}
                          Logistics & Delivery
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            value="kol"
                            onChange={handleServiceChange}
                          />{" "}
                          KOL / Affiliate
                        </label>
                      </div>
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
