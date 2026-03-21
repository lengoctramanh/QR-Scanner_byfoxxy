import { useNavigate } from "react-router-dom";
import { authStorage } from "../utils/authStorage";

// Ham nay dung de cung cap logic dang xuat tai khoan cho cac component.
// Nhan vao: khong nhan tham so nao.
// Tra ve: ham logout de xoa phien dang nhap va dieu huong ve trang login.
export default function useLogout() {
  const navigate = useNavigate();

  // Ham nay dung de xoa du lieu dang nhap hien tai va chuyen ve trang login.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: xoa authStorage va goi navigate("/login").
  const logout = () => {
    authStorage.clearAuth();
    navigate("/login");
  };

  return logout;
}
