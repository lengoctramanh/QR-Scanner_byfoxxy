import { Building, User } from "lucide-react";

// Ham nay dung de render bo nut chon vai tro dang ky user hoac brand.
// Nhan vao: role la vai tro dang duoc chon, onRoleChange la ham doi role.
// Tra ve: JSX nhom nut chon role cho form dang ky.
export default function RegisterRoleSelector({ role, onRoleChange }) {
  return (
    <div className="role-selector">
      <button type="button" className={`role-btn ${role === "user" ? "active" : ""}`} onClick={() => onRoleChange("user")}>
        <User size={18} /> Normal User
      </button>
      <button type="button" className={`role-btn ${role === "brand" ? "active" : ""}`} onClick={() => onRoleChange("brand")}>
        <Building size={18} /> Brand / Business
      </button>
    </div>
  );
}
