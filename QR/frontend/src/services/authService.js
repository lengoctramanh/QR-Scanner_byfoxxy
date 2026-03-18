import authApi from "../api/authApi";

export const submitRegistration = async (formData, role) => {
  try {
    const payload = new FormData();

    payload.append("role", role);
    payload.append("emailOrPhone", formData.emailOrPhone);
    payload.append("password", formData.password);
    payload.append("fullName", formData.fullName);
    payload.append("dob", formData.dob);
    payload.append("gender", formData.gender);

    if (role === "brand") {
      payload.append("brandName", formData.brandName);
      payload.append("taxId", formData.taxId);
      payload.append("website", formData.website);
      payload.append("industry", formData.industry);
      payload.append("productCategories", formData.productCategories);

      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          payload.append("attachments", file);
        });
      }
    }

    const response = await authApi.register(payload);

    return {
      success: true,
      message: response.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to connect to the server.",
    };
  }
};

export const submitLogin = async ({ identifier, password }) => {
  try {
    const response = await authApi.login({ identifier, password });
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to connect to the server.",
    };
  }
};

export const requestPasswordResetOtp = async (identifier) => {
  try {
    const response = await authApi.forgotPassword({ identifier });

    return {
      success: response.success !== false,
      message: response.message || "If an account exists for that email or phone, an OTP has been sent.",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Server connection error. Please try again.",
    };
  }
};
