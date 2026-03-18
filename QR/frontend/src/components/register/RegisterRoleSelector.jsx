import { Building, User } from "lucide-react";

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
