import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

// Ham nay dung de render component rieng phuc vu buoc nhap mat khau moi.
// Nhan vao: value/handler cua newPassword, confirmPassword va submit loading state.
// Tra ve: JSX form doi mat khau co nut an/hien password va validate co ban tren input.
export default function ResetPasswordForm({ newPassword, confirmPassword, onNewPasswordChange, onConfirmPasswordChange, onSubmit, isSubmitting }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form className="forgot-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label>New Password</label>
        <div className="forgot-input-wrap">
          <Lock className="forgot-icon" size={18} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="........"
            autoComplete="new-password"
            minLength={8}
            required
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
          />
          <button type="button" className="forgot-toggle-pw" onClick={() => setShowPassword((previousValue) => !previousValue)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <div className="forgot-input-wrap">
          <Lock className="forgot-icon" size={18} />
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="........"
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
          />
          <button type="button" className="forgot-toggle-pw" onClick={() => setShowConfirmPassword((previousValue) => !previousValue)}>
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <p className="forgot-hint-text">Password must be at least 8 characters.</p>

      <button type="submit" className="forgot-submit-btn" disabled={isSubmitting}>
        {isSubmitting ? <div className="spinner"></div> : "CHANGE PASSWORD"}
      </button>
    </form>
  );
}
