import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import FieldFeedbackMessage from "../common/FieldFeedbackMessage";

// Ham nay dung de render nhom thong tin tai khoan co ban trong form dang ky.
// Nhan vao: formData, trang thai hien mat khau va cac handler thay doi du lieu.
// Tra ve: JSX cac truong ten, lien he, ngay sinh, gioi tinh va mat khau.
export default function RegisterAccountSection({ formData, errors, showPassword, showConfirmPassword, onChange, onTogglePassword, onToggleConfirmPassword }) {
  return (
    <div className="form-section">
      <h4 className="section-heading">
        <ShieldCheck size={16} /> Account Information
      </h4>
      <div className="input-grid">
        <div className="input-group">
          <label>Full Name *</label>
          <input type="text" name="fullName" required placeholder="Your name" value={formData.fullName} onChange={onChange} />
          <FieldFeedbackMessage message={errors.fullName} />
        </div>
        <div className="input-group">
          <label>Email *</label>
          <input type="email" name="email" required placeholder="exam@gmail.com" value={formData.email} onChange={onChange} />
          <FieldFeedbackMessage message={errors.email} />
        </div>

        <div className="input-group">
          <label>Date of Birth *</label>
          <div className="input-with-icon">
            <input type="date" name="dob" value={formData.dob} onChange={onChange} style={{ width: "100%" }} />
          </div>
          <FieldFeedbackMessage message={errors.dob} />
        </div>
        <div className="input-group">
          <label>Gender *</label>
          <select name="gender" value={formData.gender} onChange={onChange}>
            <option value="">Select gender...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="secret">Secret</option>
            <option value="other">Other</option>
          </select>
          <FieldFeedbackMessage message={errors.gender} />
        </div>

        <div className="input-group">
          <label>Phone Number</label>
          <input type="tel" name="phone" placeholder="+84 901234567" value={formData.phone} onChange={onChange} />
          <FieldFeedbackMessage message={errors.phone} />
        </div>

        <div className="input-group">
          <label>Password *</label>
          <div className="pw-input-wrap">
            <input type={showPassword ? "text" : "password"} name="password" required placeholder="........" value={formData.password} onChange={onChange} />
            <button type="button" className="toggle-pw-btn" onClick={onTogglePassword}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldFeedbackMessage message={errors.password} />
        </div>
        <div className="input-group">
          <label>Confirm Password *</label>
          <div className="pw-input-wrap">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required placeholder="........" value={formData.confirmPassword} onChange={onChange} />
            <button type="button" className="toggle-pw-btn" onClick={onToggleConfirmPassword}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldFeedbackMessage message={errors.confirmPassword} />
        </div>
      </div>
    </div>
  );
}
