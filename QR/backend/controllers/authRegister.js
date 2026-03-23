const accountService = require("../services/accountService");
const brandRegistrationRequestService = require("../services/brandRegistrationRequestService");
const { validateRegistrationPayload } = require("../validations/registerValidation");

const authRegister = {
  // Ham nay dung de xu ly API dang ky cho user hoac brand.
  // Nhan vao: req chua du lieu form dang ky, file dinh kem va res de gui ket qua.
  // Tac dong: validate payload, goi service tao user hoac gui yeu cau brand, sau do tra JSON.
  async register(req, res) {
    try {
      const validation = validateRegistrationPayload(req.body || {}, req.files || []);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          errors: validation.errors,
        });
      }

      const normalizedPayload = validation.normalizedData;

      const result =
        normalizedPayload.role === "brand"
          ? await brandRegistrationRequestService.submitRequest({
              fullName: normalizedPayload.fullName,
              email: normalizedPayload.email,
              phone: normalizedPayload.phone,
              dob: normalizedPayload.dob,
              gender: normalizedPayload.gender,
              password: normalizedPayload.password,
              brandName: normalizedPayload.brandName,
              taxId: normalizedPayload.taxId,
              website: normalizedPayload.website,
              industry: normalizedPayload.industry,
              productCategories: normalizedPayload.productCategories,
              attachments: req.files || [],
            })
          : await accountService.createUserAccount({
              fullName: normalizedPayload.fullName,
              email: normalizedPayload.email,
              phone: normalizedPayload.phone,
              dob: normalizedPayload.dob,
              gender: normalizedPayload.gender,
              password: normalizedPayload.password,
              termsAccepted: normalizedPayload.termsAccepted,
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
        errors: result.errors || null,
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
