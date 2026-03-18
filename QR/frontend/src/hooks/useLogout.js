// src/hooks/useLogout.js
import { useNavigate } from "react-router-dom";
import { authStorage } from "../utils/authStorage";

export default function useLogout() {
  const navigate = useNavigate();

  const logout = () => {
    authStorage.clearAuth();
    navigate("/login");
  };

  return logout;
}
