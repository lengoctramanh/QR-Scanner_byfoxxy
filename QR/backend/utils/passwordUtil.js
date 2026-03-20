const bcrypt = require("bcryptjs");

const passwordService = {
  // Ham nay dung de hash mat khau voi salt tu account uuid truoc khi luu DB.
  // Nhan vao: password la mat khau goc, uuid la ma tai khoan.
  // Tra ve: Promise tra ve password hash da duoc bcrypt ma hoa.
  hashPassword: async (password, uuid) => {
    try {
      const passwordToHash = `${uuid}${password}`;
      const hashedPassword = await bcrypt.hash(passwordToHash, 10);
      return hashedPassword;
    } catch (err) {
      console.error("Error password", err);
      throw err;
    }
  },

  // Ham nay dung de so sanh mat khau nguoi dung nhap voi password hash dang luu.
  // Nhan vao: password la mat khau goc, uuid la ma tai khoan, passwordHash la hash trong DB.
  // Tra ve: Promise boolean cho biet mat khau co khop hay khong.
  comparePassword: async (password, uuid, passwordHash) => {
    try {
      const passwordToCompare = `${uuid}${password}`;
      return bcrypt.compare(passwordToCompare, passwordHash);
    } catch (err) {
      console.error("Error compare password", err);
      throw err;
    }
  },
};

module.exports = passwordService;
