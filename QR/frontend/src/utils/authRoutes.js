export const ROLE_ROUTE_MAP = {
  admin: "/admin-dashboard",
  brand: "/brand-profile",
  user: "/profile",
};

export const resolveRouteByRole = (role) => ROLE_ROUTE_MAP[role] || "/profile";

export const resolveAuthRedirectPath = (authPayload) => authPayload?.redirectTo || resolveRouteByRole(authPayload?.role);
