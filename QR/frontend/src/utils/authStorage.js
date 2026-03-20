export const authStorage = {
  // Ham nay dung de lay token dang nhap da luu trong localStorage.
  // Nhan vao: khong nhan tham so nao.
  // Tra ve: chuoi token hoac null neu chua dang nhap.
  getToken: () => localStorage.getItem("token"),

  // Ham nay dung de lay vai tro tai khoan da luu trong localStorage.
  // Nhan vao: khong nhan tham so nao.
  // Tra ve: chuoi role hoac null neu chua co du lieu.
  getRole: () => localStorage.getItem("userRole"),

  // Ham nay dung de luu thong tin dang nhap co ban vao localStorage.
  // Nhan vao: object chua token va role sau khi dang nhap thanh cong.
  // Tac dong: ghi du lieu token va role vao bo nho trinh duyet.
  setAuth: ({ token, role }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role);
  },

  // Ham nay dung de xoa thong tin dang nhap khi nguoi dung dang xuat.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: xoa token va role ra khoi localStorage.
  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
  },
};
