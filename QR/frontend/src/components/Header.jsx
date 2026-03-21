import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { QrCode, Menu } from "lucide-react";
import { authStorage } from "../utils/authStorage";

// Ham nay dung de render thanh header chung va menu dieu huong cua ung dung.
// Nhan vao: khong nhan props nao.
// Tra ve: JSX header co logo va menu dropdown.
export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardPage = ["/profile", "/brand-profile", "/admin-dashboard"].includes(location.pathname);
  const showDashboardActions = isDashboardPage && Boolean(authStorage.getToken());

  // Ham nay dung de dang xuat tai khoan hien tai va dua nguoi dung ve trang login.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: xoa du lieu dang nhap trong localStorage, dong menu va dieu huong sang /login.
  const handleLogout = () => {
    authStorage.clearAuth();
    setOpen(false);
    navigate("/login");
  };

  return (
    <header className="top-bar">
      <div className="logo-area">
        <QrCode className="qr-svg text-white" color="white" />
        <Link style={{ textDecoration: "none" }} to="/" onClick={() => setOpen(false)}>
          <span className="logo-text text-white ms-2">QR CODE</span>
        </Link>
      </div>

      <div className="menu-area">
        <button className="menu-btn" onClick={() => setOpen((v) => !v)}>
          <Menu className="menu-svg" color="white" />
        </button>
        <div className={`dropdown-menu ${open ? "show" : ""}`}>
          <Link to="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          {showDashboardActions ? (
            <button type="button" className="dropdown-action-btn" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <>
              <Link to="/register" onClick={() => setOpen(false)}>
                Sign up
              </Link>
              <Link to="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
