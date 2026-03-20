import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authStorage } from "../utils/authStorage";
import { resolveRouteByRole } from "../utils/authRoutes";

// Ham nay dung de chan nguoi dung vao sai trang neu chua dang nhap hoac sai role.
// Nhan vao: allowedRole la role duoc phep truy cap trang hien tai.
// Tac dong: dieu huong nguoi dung ve /login hoac route dung voi role cua ho.
export default function useAuthCheck(allowedRole) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = authStorage.getToken();
    const role = authStorage.getRole();

    if (!token) {
      navigate("/login");
      return;
    }

    if (allowedRole && role !== allowedRole) {
      navigate(resolveRouteByRole(role));
    }
  }, [allowedRole, navigate]);
}
