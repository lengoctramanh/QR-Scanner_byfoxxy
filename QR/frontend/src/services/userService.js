import userApi from "../api/userApi";

// Ham nay dung de tai du lieu tab Scan History va Active Codes tu backend.
// Nhan vao: khong nhan tham so, request se tu dong gui token dang nhap.
// Tra ve: object success/data/message cho hook dashboard user.
export const fetchUserDashboard = async () => {
  try {
    const response = await userApi.getDashboard();

    return {
      success: response.success !== false,
      data: response.data || {
        history: [],
        activeCodes: [],
      },
      message: response.message || "",
    };
  } catch (error) {
    return {
      success: false,
      data: {
        history: [],
        activeCodes: [],
      },
      message: error.response?.data?.message || "Unable to load the dashboard data right now.",
    };
  }
};

// Ham nay dung de luu profile hien tai cua tai khoan dang dang nhap va dong goi ket qua cho hook.
// Nhan vao: payload la FormData chua text fields va file upload cua form settings.
// Tra ve: object success/message/data de giao dien cap nhat state.
export const updateCurrentProfile = async (payload) => {
  try {
    const response = await userApi.updateProfile(payload);

    return {
      success: response.success !== false,
      message: response.message || "Profile updated successfully.",
      data: response.data || null,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to save the profile right now.",
    };
  }
};

// Ham nay dung de dong goi ket qua API doi mat khau de component React de xu ly.
// Nhan vao: payload gom currentPassword, newPassword va confirmPassword.
// Tra ve: object success/message de giao dien hien thi thong bao.
export const changeUserPassword = async (payload) => {
  try {
    const response = await userApi.changePassword(payload);

    return {
      success: response.success !== false,
      message: response.message || "Password updated successfully. Please sign in again.",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to change the password right now.",
    };
  }
};

// Ham nay dung de claim Token(2) da duoc guest luu tru de gan QR vao tai khoan user hien tai.
// Nhan vao: token la raw token hoac claim URL day du.
// Tra ve: object success/message/data de giao dien cap nhat active codes va history.
export const claimUserGuestToken = async (token) => {
  try {
    const response = await userApi.claimGuestToken({ token });

    return {
      success: response.success !== false,
      message: response.message || "Token(2) processed successfully.",
      data: response.data || null,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to claim Token(2) right now.",
    };
  }
};

// Ham nay dung de xoa mem mot dong lich su scan cua user tren dashboard.
// Nhan vao: userHistoryId la ma item can an khoi giao dien.
// Tra ve: object success/message/data de hook cap nhat state.
export const deleteUserScanHistory = async (userHistoryId) => {
  try {
    const response = await userApi.deleteScanHistory(userHistoryId);

    return {
      success: response.success !== false,
      message: response.message || "The scan history item was removed.",
      data: response.data || null,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to remove the scan history item right now.",
    };
  }
};
