const bcrypt = require("bcryptjs");
// dùng thư viện bryptjs để tiến hành hash
const passwordService = {
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
