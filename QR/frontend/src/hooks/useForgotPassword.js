import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordResetOtp } from "../services/authService";

const OTP_DURATION_SECONDS = 120;

// Ham nay dung de quan ly luong quen mat khau gom gui OTP, xac minh va dat lai mat khau.
// Nhan vao: khong nhan tham so nao.
// Tra ve: state va cac handler de trang ForgotPassword su dung.
export default function useForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_DURATION_SECONDS);

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return undefined;

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, timeLeft]);

  // Ham nay dung de gui yeu cau tao OTP dua tren email hoac so dien thoai.
  // Nhan vao: event la su kien submit cua buoc dau tien.
  // Tac dong: goi service forgot password va cap nhat step/message theo ket qua.
  const handleSendOtp = async (event) => {
    event?.preventDefault?.();

    if (!identifier.trim()) {
      setStatus("error");
      setMessage("Please enter your email or phone.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const result = await requestPasswordResetOtp(identifier.trim());

    if (!result.success) {
      setStatus("error");
      setMessage(result.message);
      return;
    }

    setStep(2);
    setTimeLeft(OTP_DURATION_SECONDS);
    setStatus("idle");
    setMessage(result.message);
  };

  // Ham nay dung de kiem tra ma OTP nguoi dung vua nhap.
  // Nhan vao: event la su kien submit cua form OTP.
  // Tac dong: kiem tra do dai OTP va chuyen sang buoc dat lai mat khau neu hop le.
  const handleVerifyOtp = (event) => {
    event.preventDefault();

    if (otp.trim().length !== 6) {
      setStatus("error");
      setMessage("OTP must contain exactly 6 digits.");
      return;
    }

    setStatus("loading");
    setMessage("");

    setTimeout(() => {
      setStatus("idle");
      setStep(3);
      setMessage("OTP verified successfully.");
    }, 500);
  };

  // Ham nay dung de dat lai mat khau moi sau khi OTP duoc xac minh.
  // Nhan vao: event la su kien submit cua form dat lai mat khau.
  // Tac dong: validate mat khau moi, hien thong bao va dieu huong ve login.
  const handleResetPassword = (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Confirm password does not match.");
      return;
    }

    setStatus("loading");
    setMessage("");

    setTimeout(() => {
      setStatus("success");
      setMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);
    }, 600);
  };

  return {
    step,
    identifier,
    otp,
    newPassword,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    status,
    message,
    timeLeft,
    setIdentifier,
    setOtp,
    setNewPassword,
    setConfirmPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
  };
}
