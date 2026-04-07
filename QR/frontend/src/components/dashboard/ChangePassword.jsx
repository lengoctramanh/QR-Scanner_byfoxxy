import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeUserPassword } from "../../services/userService";
import { authStorage } from "../../utils/authStorage";

const INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const INITIAL_VISIBILITY = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
};

// Ham nay dung de render form doi mat khau trong trang ca nhan va tu xu ly submit.
// Nhan vao: khong nhan props, tu goi service doi mat khau va dieu huong sang forgot-password khi can.
// Tra ve: JSX form doi mat khau co validate frontend, eye toggle va thong bao ket qua.
export default function ChangePassword() {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [passwordVisibility, setPasswordVisibility] = useState(INITIAL_VISIBILITY);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(
    () => () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    },
    [],
  );

  // Ham nay dung de cap nhat state moi khi user thay doi gia tri trong input.
  // Nhan vao: event la su kien onChange cua input password.
  // Tac dong: cap nhat field tuong ung va xoa feedback cu de UX ro rang hon.
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (feedback.message) {
      setFeedback({ type: "", message: "" });
    }
  };

  // Ham nay dung de an/hien tung o mat khau ma khong anh huong cac o con lai.
  // Nhan vao: fieldName la ten truong can toggle visibility.
  // Tac dong: dao trang thai hien/an cua truong duoc chon.
  const togglePasswordVisibility = (fieldName) => {
    setPasswordVisibility((currentVisibility) => ({
      ...currentVisibility,
      [fieldName]: !currentVisibility[fieldName],
    }));
  };

  // Ham nay dung de validate truoc khi gui request len backend.
  // Nhan vao: formData hien tai tu state.
  // Tra ve: message loi dau tien neu du lieu chua hop le, nguoc lai tra ve chuoi rong.
  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      return "Current password is required.";
    }

    if (formData.newPassword.trim().length < 8) {
      return "New password must be at least 8 characters.";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return "New password and confirm password do not match.";
    }

    return "";
  };

  // Ham nay dung de submit yeu cau doi mat khau len backend.
  // Nhan vao: event la submit event cua form.
  // Tac dong: validate frontend, goi API va logout dieu huong ve login neu doi thanh cong.
  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFeedback({
        type: "error",
        message: validationMessage,
      });
      return;
    }

    setIsSubmitting(true);

    const result = await changeUserPassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      setFeedback({
        type: "error",
        message: result.message,
      });
      setIsSubmitting(false);
      return;
    }

    setFeedback({
      type: "success",
      message: result.message,
    });
    setFormData(INITIAL_FORM);
    setIsSubmitting(false);

    redirectTimeoutRef.current = window.setTimeout(() => {
      authStorage.clearAuth();
      navigate("/login");
    }, 1400);
  };

  const renderPasswordField = (fieldName, label) => (
    <label className="change-password-field" htmlFor={fieldName}>
      <span>{label}</span>
      <div className="change-password-input-shell">
        <input
          id={fieldName}
          name={fieldName}
          type={passwordVisibility[fieldName] ? "text" : "password"}
          value={formData[fieldName]}
          onChange={handleInputChange}
          placeholder="........"
          autoComplete={fieldName === "currentPassword" ? "current-password" : "new-password"}
          className="change-password-input"
        />
        <button type="button" className="change-password-visibility-btn" onClick={() => togglePasswordVisibility(fieldName)} aria-label={passwordVisibility[fieldName] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>
          {passwordVisibility[fieldName] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );

  return (
    <section className="change-password-card">
      <div className="change-password-header">
        <div className="change-password-icon">
          <KeyRound size={18} />
        </div>
        <div>
          <h3>Change Password</h3>
          <p>Update your password securely and keep your account protected.</p>
        </div>
      </div>

      <form className="change-password-form" onSubmit={handleSubmit}>
        <div className="change-password-grid">
          {renderPasswordField("currentPassword", "Current Password")}
          {renderPasswordField("newPassword", "New Password")}
          {renderPasswordField("confirmPassword", "Confirm New Password")}
        </div>

        <p className="change-password-note">Your new password must contain at least 8 characters.</p>

        {feedback.message ? <div className={`change-password-feedback ${feedback.type}`}>{feedback.message}</div> : null}

        <button type="submit" className="save-btn change-password-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "UPDATING..." : "UPDATE PASSWORD"}
        </button>

        <button type="button" className="forgot-password-inline-btn" onClick={() => navigate("/forgot-password")}>
          Forgot password? Click here to receive an OTP by email.
        </button>
      </form>
    </section>
  );
}
