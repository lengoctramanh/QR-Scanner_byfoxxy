import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authStorage } from "../utils/authStorage";
import { resolveRouteByRole } from "../utils/authRoutes";

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
