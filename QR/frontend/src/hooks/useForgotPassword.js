import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordResetOtp, resetPasswordWithToken, verifyPasswordResetOtp } from "../services/authService";

const DEFAULT_OTP_DURATION_SECONDS = 5 * 60;
const PASSWORD_MIN_LENGTH = 8;

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
  const [resetToken, setResetToken] = useState("");
  const [deliveryHint, setDeliveryHint] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_OTP_DURATION_SECONDS);

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((previousValue) => previousValue - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [step, timeLeft]);

  // Ham nay dung de xoa feedback cu khi nguoi dung thay doi du lieu input.
  // Nhan vao: khong nhan tham so, cap nhat status/message ve trang thai trung lap.
  // Tac dong: giup giao dien khong bi giu lai loi/success cu khi user sua form.
  const clearFeedback = () => {
    if (status !== "loading") {
      setStatus("idle");
      setMessage("");
    }
  };

  // Ham nay dung de dong goi logic goi API gui OTP de co the dung lai cho resend.
  // Nhan vao: khong nhan tham so, su dung identifier hien tai tu state.
  // Tra ve: Promise boolean cho biet co gui yeu cau thanh cong hay khong.
  const submitSendOtp = async () => {
    if (!identifier.trim()) {
      setStatus("error");
      setMessage("Please enter your email or phone.");
      return false;
    }

    setStatus("loading");
    setMessage("");

    const result = await requestPasswordResetOtp(identifier.trim());

    if (!result.success) {
      setStatus("error");
      setMessage(result.message);
      return false;
    }

    setStep(2);
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setDeliveryHint(result.data?.deliveryHint || null);
    setTimeLeft(Number(result.data?.expiresInSeconds) || DEFAULT_OTP_DURATION_SECONDS);
    setStatus("idle");
    setMessage(result.message);
    return true;
  };

  // Ham nay dung de gui yeu cau tao OTP dua tren email hoac so dien thoai.
  // Nhan vao: event la su kien submit cua buoc dau tien.
  // Tac dong: goi API forgot password va chuyen giao dien sang buoc OTP neu thanh cong.
  const handleSendOtp = async (event) => {
    event?.preventDefault?.();
    await submitSendOtp();
  };

  // Ham nay dung de yeu cau gui lai OTP sau khi ma cu het han.
  // Nhan vao: khong nhan tham so; duoc goi tu nut Resend Code.
  // Tac dong: dung lai logic gui OTP de dat lai countdown va thong bao moi.
  const handleResendOtp = async () => {
    await submitSendOtp();
  };

  // Ham nay dung de kiem tra ma OTP nguoi dung vua nhap voi backend.
  // Nhan vao: event la su kien submit cua form OTP.
  // Tac dong: goi API verify-otp va chuyen sang component doi mat khau neu hop le.
  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp.trim())) {
      setStatus("error");
      setMessage("OTP must contain exactly 6 digits.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const result = await verifyPasswordResetOtp({
      identifier: identifier.trim(),
      otp: otp.trim(),
    });

    if (!result.success || !result.data?.resetToken) {
      setStatus("error");
      setMessage(result.message || "Unable to verify the code right now.");
      return;
    }

    setResetToken(result.data.resetToken);
    setStep(3);
    setStatus("idle");
    setMessage("OTP verified successfully. Set your new password below.");
  };

  // Ham nay dung de dat lai mat khau moi sau khi OTP duoc xac minh.
  // Nhan vao: event la su kien submit cua form dat lai mat khau.
  // Tac dong: validate mat khau moi, goi API reset-password va dieu huong ve login.
  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (newPassword.trim().length < PASSWORD_MIN_LENGTH) {
      setStatus("error");
      setMessage(`New password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Confirm password does not match.");
      return;
    }

    if (!resetToken) {
      setStatus("error");
      setMessage("Reset session is missing. Please verify the OTP again.");
      setStep(2);
      return;
    }

    setStatus("loading");
    setMessage("");

    const result = await resetPasswordWithToken({
      resetToken,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      setStatus("error");
      setMessage(result.message);
      return;
    }

    setStatus("success");
    setMessage(result.message || "Password reset successfully. Redirecting to login...");

    window.setTimeout(() => {
      navigate("/login");
    }, 1200);
  };

  return {
    step,
    identifier,
    otp,
    newPassword,
    confirmPassword,
    deliveryHint,
    status,
    message,
    timeLeft,
    setIdentifier: (value) => {
      clearFeedback();
      setIdentifier(value);
    },
    setOtp: (value) => {
      clearFeedback();
      setOtp(value);
    },
    setNewPassword: (value) => {
      clearFeedback();
      setNewPassword(value);
    },
    setConfirmPassword: (value) => {
      clearFeedback();
      setConfirmPassword(value);
    },
    handleSendOtp,
    handleResendOtp,
    handleVerifyOtp,
    handleResetPassword,
  };
}
