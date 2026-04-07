import authApi from "../api/authApi";

// Ham nay dung de dong goi va gui du lieu dang ky tu frontend sang backend.
// Nhan vao: formData la du lieu form dang ky, role la vai tro user hoac brand.
// Tra ve: object thong bao ket qua dang ky de page hien thi.
export const submitRegistration = async (formData, role) => {
  try {
    const payload = new FormData();

    payload.append("role", role);
    payload.append("email", formData.email);
    payload.append("phone", formData.phone);
    payload.append("password", formData.password);
    payload.append("confirmPassword", formData.confirmPassword);
    payload.append("fullName", formData.fullName);
    payload.append("dob", formData.dob);
    payload.append("gender", formData.gender);
    payload.append("termsAccepted", String(formData.termsAccepted));

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
      data: response.data || null,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to connect to the server.",
      errors: error.response?.data?.errors || null,
    };
  }
};

// Ham nay dung de goi API dang nhap va dong goi ket qua cho page login.
// Nhan vao: object chua identifier va password nguoi dung nhap.
// Tra ve: object success/data hoac message loi de giao dien xu ly.
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

// Ham nay dung de gui yeu cau xin OTP dat lai mat khau.
// Nhan vao: identifier la email hoac so dien thoai nguoi dung cung cap.
// Tra ve: object thong bao thanh cong hoac that bai de hook quen mat khau su dung.
export const requestPasswordResetOtp = async (identifier) => {
  try {
    const response = await authApi.forgotPassword({ identifier });

    return {
      success: response.success !== false,
      message: response.message || "If an account exists for that email or phone, an OTP has been sent.",
      data: response.data || {},
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Server connection error. Please try again.",
    };
  }
};

// Ham nay dung de gui OTP len backend de xac minh va lay reset token tam thoi.
// Nhan vao: object chua identifier va otp 6 chu so.
// Tra ve: object success/data/message de hook quen mat khau xu ly.
export const verifyPasswordResetOtp = async ({ identifier, otp }) => {
  try {
    const response = await authApi.verifyOtp({ identifier, otp });

    return {
      success: response.success !== false,
      message: response.message || "OTP verified successfully.",
      data: response.data || {},
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to verify the code right now.",
    };
  }
};

// Ham nay dung de gui mat khau moi cung reset token len backend.
// Nhan vao: object chua resetToken, newPassword va confirmPassword.
// Tra ve: object success/message de hook quen mat khau dieu huong sau khi doi xong.
export const resetPasswordWithToken = async ({ resetToken, newPassword, confirmPassword }) => {
  try {
    const response = await authApi.resetPassword({
      resetToken,
      newPassword,
      confirmPassword,
    });

    return {
      success: response.success !== false,
      message: response.message || "Password reset successfully. Please sign in again.",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to reset the password right now.",
    };
  }
};

// Ham nay dung de lay profile hien tai cua user tu backend va dong goi ket qua cho hook.
// Nhan vao: khong nhan tham so, token se duoc axiosClient tu dong gui kem request.
// Tra ve: object success/data hoac message loi de useUserDashboard su dung.
export const fetchCurrentUserProfile = async () => {
  try {
    const response = await authApi.getMe();

    return {
      success: response.success !== false,
      data: response.data || null,
      message: response.message || "",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to load user profile.",
    };
  }
};
