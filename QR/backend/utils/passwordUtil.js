const bcrypt = require("bcryptjs");

// Ham nay dung de chuan hoa email/key duoc dung lam "pepper" o tang ung dung.
// Nhan vao: keyValue la email hoac gia tri fallback.
// Tra ve: chuoi da trim va lower-case.
const normalizePasswordKey = (keyValue) => String(keyValue || "").trim().toLowerCase();

// Ham nay dung de tao chuoi nguon nhat quan truoc khi dua vao bcrypt hash/compare.
// Nhan vao: password goc va passwordKey (uu tien email).
// Tra ve: chuoi ket hop key + password.
const buildPasswordSource = (password, passwordKey) => `${normalizePasswordKey(passwordKey)}::${String(password || "")}`;

const passwordService = {
  // Ham nay dung de hash mat khau voi key uu tien la email de phu hop rule moi.
  // Nhan vao: password la mat khau goc, passwordKey thuong la email.
  // Tra ve: Promise tra ve password hash da duoc bcrypt ma hoa.
  hashPassword: async (password, passwordKey) => {
    try {
      const hashedPassword = await bcrypt.hash(buildPasswordSource(password, passwordKey), 10);
      return hashedPassword;
    } catch (err) {
      console.error("Error password", err);
      throw err;
    }
  },

  // Ham nay dung de so sanh mat khau nguoi dung nhap voi password hash dang luu.
  // Nhan vao: password, passwordKey moi (email), passwordHash va legacyFallbackKey neu can tuong thich du lieu cu.
  // Tra ve: Promise boolean cho biet mat khau co khop hay khong.
  comparePassword: async (password, passwordKey, passwordHash, legacyFallbackKey = null) => {
    try {
      const primaryMatched = await bcrypt.compare(buildPasswordSource(password, passwordKey), passwordHash);

      if (primaryMatched) {
        return true;
      }

      if (!legacyFallbackKey) {
        return false;
      }

      return bcrypt.compare(buildPasswordSource(password, legacyFallbackKey), passwordHash);
    } catch (err) {
      console.error("Error compare password", err);
      throw err;
    }
  },
};

module.exports = passwordService;
