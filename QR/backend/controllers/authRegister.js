const accountService = require("../services/accountService");
const brandRegistrationRequestService = require("../services/brandRegistrationRequestService");

const authRegister = {
  // Ham nay dung de xu ly API dang ky cho user hoac brand.
  // Nhan vao: req chua du lieu form dang ky, file dinh kem va res de gui ket qua.
  // Tac dong: validate payload, goi service tao user hoac gui yeu cau brand, sau do tra JSON.
  async register(req, res) {
    try {
      const { fullName, emailOrPhone, dob, gender, password, role, brandName, taxId, website, industry, productCategories } = req.body;

      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();

      if (!fullName || !emailOrPhone || !password || !normalizedRole) {
        return res.status(400).json({
          success: false,
          message: "Missing required registration fields.",
        });
      }

      if (!["user", "brand"].includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role selected.",
        });
      }

      if (!dob) {
        return res.status(400).json({
          success: false,
          message: "Date of birth is required.",
        });
      }

      if (normalizedRole === "brand" && (!brandName || !taxId)) {
        return res.status(400).json({
          success: false,
          message: "Brand name and tax ID are required for business registration.",
        });
      }

      if (normalizedRole === "user") {
        const isExisted = await accountService.exist(emailOrPhone);

        if (isExisted) {
          return res.status(400).json({
            success: false,
            message: "Email or phone number already exists!",
          });
        }
      }

      const result =
        normalizedRole === "brand"
          ? await brandRegistrationRequestService.submitRequest({
              fullName,
              emailOrPhone,
              dob,
              gender,
              password,
              brandName,
              taxId,
              website,
              industry,
              productCategories,
              attachments: req.files || [],
            })
          : await accountService.createUserAccount({
              fullName,
              emailOrPhone,
              dob,
              gender,
              password,
            });

      if (result && result.isValid) {
        return res.status(result.httpStatus || 201).json({
          success: true,
          message: result.message || "Registration successful!",
          data: result.data || null,
        });
      }

      return res.status(result.httpStatus || 500).json({
        success: false,
        message: result.message || "Registration failed!",
      });
    } catch (error) {
      console.error("Controller Error (register):", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = authRegister;
