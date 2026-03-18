export const authStorage = {
  getToken: () => localStorage.getItem("token"),
  getRole: () => localStorage.getItem("userRole"),

  setAuth: ({ token, role }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role);
  },

  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
  },
};
