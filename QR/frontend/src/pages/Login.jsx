import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, QrCode, Smartphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { submitLogin } from "../services/authService";
import { authStorage } from "../utils/authStorage";
import { resolveAuthRedirectPath } from "../utils/authRoutes";
import "./Login.css";

const welcomeTexts = ["manage your brand & products.", "track your orders & history.", "connect with global partners."];

export default function Login() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [textIndex, setTextIndex] = useState(0);

  const isFormValid = loginMethod === "password" ? identifier.trim() !== "" && password.trim() !== "" : identifier.trim() !== "" && otp.trim() !== "";

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % welcomeTexts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const showOtpUnavailable = () => {
    setStatus("error");
    setErrorMessage("OTP sign-in is not available yet.");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!isFormValid) return;

    if (loginMethod !== "password") {
      showOtpUnavailable();
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    const result = await submitLogin({
      identifier,
      password,
    });

    if (!result.success) {
      setStatus("error");
      setErrorMessage(result.message);
      return;
    }

    const responsePayload = result.data;

    if (!responsePayload.success) {
      setStatus("error");
      setErrorMessage(responsePayload.message || "Login failed.");
      return;
    }

    const authPayload = responsePayload.data || {};

    authStorage.setAuth({
      token: responsePayload.token,
      role: authPayload.role,
    });

    setStatus("success");

    setTimeout(() => {
      navigate(resolveAuthRedirectPath(authPayload));
    }, 1000);
  };

  return (
    <main className="login-main">
      <div className="login-card">
        <div className="login-banner">
          <div className="banner-content">
            <h2>Welcome Back!</h2>
            <p>
              Sign in to <strong>{welcomeTexts[textIndex]}</strong>
            </p>
          </div>
          <div className="banner-graphic">
            <div className="circle c1"></div>
            <div className="circle c2"></div>
            <QrCode size={100} className="banner-qr" />
          </div>
        </div>

        <div className="login-form-container">
          <div className="login-header">
            <h3>Sign In</h3>
            <p>Enter your details to access your account.</p>
          </div>

          <div className="login-method-toggle">
            <button
              type="button"
              className={loginMethod === "password" ? "active" : ""}
              onClick={() => {
                setLoginMethod("password");
                setStatus("idle");
                setErrorMessage("");
              }}>
              Password
            </button>
            <button
              type="button"
              className={loginMethod === "otp" ? "active" : ""}
              onClick={() => {
                setLoginMethod("otp");
                setStatus("idle");
                setErrorMessage("");
              }}>
              Send OTP
            </button>
          </div>

          {status === "error" ? (
            <div className="msg-alert error">
              <AlertCircle size={18} /> <span>{errorMessage}</span>
            </div>
          ) : null}

          {status === "success" ? (
            <div className="msg-alert success">
              <CheckCircle2 size={18} /> <span>Login successful! Redirecting...</span>
            </div>
          ) : null}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email or Phone Number</label>
              <div className="input-icon-wrap">
                <Mail className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="Enter email or phone"
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    setStatus("idle");
                    setErrorMessage("");
                  }}
                />
              </div>
            </div>

            {loginMethod === "password" ? (
              <div className="form-group">
                <label>Password</label>
                <div className="input-icon-wrap">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="........"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setStatus("idle");
                      setErrorMessage("");
                    }}
                  />
                  <button type="button" className="toggle-pw-btn" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="form-group slide-in">
                <label>One-Time Password (OTP)</label>
                <div className="input-icon-wrap">
                  <Smartphone className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value);
                      setStatus("idle");
                      setErrorMessage("");
                    }}
                    maxLength="6"
                  />
                  <button type="button" className="get-otp-btn" onClick={showOtpUnavailable}>
                    Get OTP
                  </button>
                </div>
              </div>
            )}

            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-pw">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className={`submit-login-btn ${status === "loading" ? "loading" : ""}`} disabled={!isFormValid || status === "loading"}>
              {status === "loading" ? (
                <div className="spinner"></div>
              ) : (
                <>
                  SIGN IN <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="social-login-divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <div className="social-buttons">
              <button type="button" className="btn-social google">
                <i className="fa-brands fa-google"></i> Google
              </button>
              <button type="button" className="btn-social apple">
                <i className="fa-brands fa-apple"></i> Apple
              </button>
            </div>

            <div className="register-prompt">
              Don't have an account? <Link to="/register">Create one now</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
