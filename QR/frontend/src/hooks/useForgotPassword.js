import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordResetOtp } from "../services/authService";

const OTP_DURATION_SECONDS = 120;

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
