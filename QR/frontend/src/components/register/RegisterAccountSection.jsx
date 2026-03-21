import { Eye, EyeOff, ShieldCheck } from "lucide-react";

// Ham nay dung de render nhom thong tin tai khoan co ban trong form dang ky.
// Nhan vao: formData, trang thai hien mat khau va cac handler thay doi du lieu.
// Tra ve: JSX cac truong ten, lien he, ngay sinh, gioi tinh va mat khau.
export default function RegisterAccountSection({ formData, showPassword, showConfirmPassword, onChange, onTogglePassword, onToggleConfirmPassword }) {
  return (
    <div className="form-section">
      <h4 className="section-heading">
        <ShieldCheck size={16} /> Account Information
      </h4>
      <div className="input-grid">
        <div className="input-group">
          <label>Full Name / Representative Name *</label>
          <input type="text" name="fullName" required placeholder="John Doe" value={formData.fullName} onChange={onChange} />
        </div>
        <div className="input-group">
          <label>Email or Phone Number *</label>
          <input type="text" name="emailOrPhone" required placeholder="email@example.com" value={formData.emailOrPhone} onChange={onChange} />
        </div>

        <div className="input-group">
          <label>Date of Birth *</label>
          <div className="input-with-icon">
            <input type="date" name="dob" value={formData.dob} onChange={onChange} style={{ width: "100%" }} />
          </div>
        </div>
        <div className="input-group">
          <label>Gender (Optional)</label>
          <select name="gender" value={formData.gender} onChange={onChange}>
            <option value="">Select gender...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="secret">Secret</option>
          </select>
        </div>

        <div className="input-group">
          <label>Password *</label>
          <div className="pw-input-wrap">
            <input type={showPassword ? "text" : "password"} name="password" required placeholder="--------" value={formData.password} onChange={onChange} />
            <button type="button" className="toggle-pw-btn" onClick={onTogglePassword}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="input-group">
          <label>Confirm Password *</label>
          <div className="pw-input-wrap">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required placeholder="--------" value={formData.confirmPassword} onChange={onChange} />
            <button type="button" className="toggle-pw-btn" onClick={onToggleConfirmPassword}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
