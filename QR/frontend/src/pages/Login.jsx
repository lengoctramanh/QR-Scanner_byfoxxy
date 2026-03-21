import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { submitLogin } from "../services/authService";
import { authStorage } from "../utils/authStorage";
import { resolveAuthRedirectPath } from "../utils/authRoutes";
import "./Login.css";

// Ham nay dung de render trang dang nhap va xu ly luong sign in cua nguoi dung.
// Nhan vao: khong nhan props, su dung state noi bo va navigate cua router.
// Tra ve: giao dien dang nhap bang mat khau va dieu huong sau khi dang nhap thanh cong.
export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isFormValid = identifier.trim() !== "" && password.trim() !== "";

  // Ham nay dung de gui thong tin dang nhap len backend va xu ly ket qua tra ve.
  // Nhan vao: event submit cua form dang nhap.
  // Tac dong: goi service dang nhap, luu token/role vao authStorage va dieu huong sang trang phu hop.
  const handleLogin = async (event) => {
    event.preventDefault();
    if (!isFormValid) return;

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
        <div className="login-form-container">
          <div className="login-header">
            <h3>Sign In</h3>
            <p>Enter your details to access your account.</p>
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

            <div className="register-prompt">
              Don't have an account? <Link to="/register">Create one now</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
