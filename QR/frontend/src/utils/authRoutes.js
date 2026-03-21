export const ROLE_ROUTE_MAP = {
  admin: "/admin-dashboard",
  brand: "/brand-profile",
  user: "/profile",
};

// Ham nay dung de tim duong dan mac dinh theo role cua tai khoan.
// Nhan vao: role la vai tro cua nguoi dung dang dang nhap.
// Tra ve: chuoi route phu hop voi role, mac dinh la /profile.
export const resolveRouteByRole = (role) => ROLE_ROUTE_MAP[role] || "/profile";

// Ham nay dung de uu tien route redirect tu payload dang nhap neu backend co tra ve.
// Nhan vao: authPayload la object du lieu dang nhap backend tra ve.
// Tra ve: route redirect cuoi cung de frontend dieu huong nguoi dung.
export const resolveAuthRedirectPath = (authPayload) => authPayload?.redirectTo || resolveRouteByRole(authPayload?.role);
