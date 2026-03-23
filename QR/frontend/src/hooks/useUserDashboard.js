import { useEffect, useRef, useState } from "react";
import { fetchCurrentUserProfile } from "../services/authService";
import {
  claimUserGuestToken,
  deleteUserScanHistory,
  fetchUserDashboard,
  updateCurrentProfile,
} from "../services/userService";
import useAuthCheck from "./useAuthCheck";

const INITIAL_USER_INFO = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  avatar: "",
};

const INITIAL_PROFILE_FEEDBACK = {
  type: "",
  message: "",
};

const INITIAL_CLAIM_FEEDBACK = {
  type: "",
  message: "",
};

const INITIAL_DASHBOARD_STATE = {
  history: [],
  activeCodes: [],
};

// Ham nay dung de chi giu lai avatar_url hop le, con null/chuoi rong/gia tri gia se tra ve rong.
// Nhan vao: avatarUrl la gia tri avatar_url backend tra ve.
// Tra ve: URL hop le de render, hoac chuoi rong de giao dien dung avatar mac dinh.
const normalizeAvatarUrl = (avatarUrl) => {
  const normalizedValue = typeof avatarUrl === "string" ? avatarUrl.trim() : "";

  if (!normalizedValue || normalizedValue === "null" || normalizedValue === "undefined") {
    return "";
  }

  return normalizedValue;
};

// Ham nay dung de dua profile backend ve format state ma form user dashboard dang su dung.
// Nhan vao: profile la object tu endpoint /auth/me.
// Tra ve: object userInfo da chuan hoa cho input va sidebar.
const mapProfileToUserInfo = (profile = {}) => ({
  fullName: profile.fullName || "",
  email: profile.email || "",
  phone: profile.phone || "",
  dob: typeof profile.dob === "string" && profile.dob.includes("T") ? profile.dob.split("T")[0] : profile.dob || "",
  gender: profile.gender || "",
  avatar: normalizeAvatarUrl(profile.avatarUrl),
});

// Ham nay dung de kiem tra tep nguoi dung vua chon co phai anh hop le khong.
// Nhan vao: file la doi tuong File tu input hoac drag-drop.
// Tra ve: true neu la anh, nguoc lai la false.
const isImageFile = (file) => Boolean(file) && String(file.type || "").toLowerCase().startsWith("image/");

// Ham nay dung de kiem tra item co con han de dua vao tab Active Codes hay khong.
// Nhan vao: item la card active code backend tra ve.
// Tra ve: true neu item chua het han hoac khong co expiry, nguoc lai la false.
const isStillActive = (item) => {
  if (!item?.expiryDate) {
    return true;
  }

  return new Date(item.expiryDate).getTime() > Date.now();
};

// Ham nay dung de quan ly du lieu va thao tac cua trang dashboard user.
// Nhan vao: khong nhan tham so nao.
// Tra ve: state dashboard, thong tin user va cac handler de component giao dien su dung.
export default function useUserDashboard() {
  useAuthCheck("user");

  const [activeTab, setActiveTab] = useState("history");
  const [selectedScan, setSelectedScan] = useState(null);
  const [userInfo, setUserInfo] = useState(INITIAL_USER_INFO);
  const [profileFeedback, setProfileFeedback] = useState(INITIAL_PROFILE_FEEDBACK);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [claimTokenValue, setClaimTokenValue] = useState("");
  const [claimFeedback, setClaimFeedback] = useState(INITIAL_CLAIM_FEEDBACK);
  const [isClaimingToken, setIsClaimingToken] = useState(false);
  const [pendingDeleteHistoryId, setPendingDeleteHistoryId] = useState("");
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [dashboardData, setDashboardData] = useState(INITIAL_DASHBOARD_STATE);
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Ham nay dung de tai dong thoi profile va du lieu dashboard that tu backend.
  // Nhan vao: tuy chon showLoading de quyet dinh co hien loading state hay khong.
  // Tac dong: cap nhat userInfo, history va activeCodes tu DB neu request thanh cong.
  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) {
      setIsDashboardLoading(true);
    }

    const [profileResult, dashboardResult] = await Promise.all([
      fetchCurrentUserProfile(),
      fetchUserDashboard(),
    ]);

    if (profileResult.success) {
      setUserInfo(mapProfileToUserInfo(profileResult.data || {}));
    } else {
      console.error("Hook Error (useUserDashboard profile):", profileResult.message);
    }

    if (dashboardResult.success) {
      setDashboardData({
        history: Array.isArray(dashboardResult.data?.history)
          ? dashboardResult.data.history
          : [],
        activeCodes: Array.isArray(dashboardResult.data?.activeCodes)
          ? dashboardResult.data.activeCodes
          : [],
      });
      setDashboardMessage("");
    } else {
      setDashboardData(INITIAL_DASHBOARD_STATE);
      setDashboardMessage(
        dashboardResult.message || "Unable to load your tracked QR codes right now.",
      );
    }

    if (showLoading) {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapDashboard = async () => {
      await loadDashboardData(true);

      if (!isMounted) {
        return;
      }
    };

    void bootstrapDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeScans = dashboardData.activeCodes.filter(isStillActive);
  const scanHistoryData = dashboardData.history;

  // Ham nay dung de cap nhat tung field profile user ngay tren form settings.
  // Nhan vao: field la ten truong can doi, value la gia tri moi tu input.
  // Tac dong: cap nhat state userInfo va xoa feedback cu neu dang hien.
  const handleProfileFieldChange = (field, value) => {
    setUserInfo((currentInfo) => ({
      ...currentInfo,
      [field]: value,
    }));

    if (profileFeedback.message) {
      setProfileFeedback(INITIAL_PROFILE_FEEDBACK);
    }
  };

  // Ham nay dung de cap nhat gia tri Token(2) ma user dang nhap vao tab Active Codes.
  // Nhan vao: nextValue la chuoi token moi tu input.
  // Tac dong: dong bo state input va xoa feedback cu neu co.
  const handleClaimTokenValueChange = (nextValue) => {
    setClaimTokenValue(nextValue);

    if (claimFeedback.message) {
      setClaimFeedback(INITIAL_CLAIM_FEEDBACK);
    }
  };

  // Ham nay dung de nhan file avatar moi va cap nhat preview truoc khi nguoi dung bam save.
  // Nhan vao: file la tep anh tu input hoac drag-drop.
  // Tac dong: luu File vao state va thay avatar preview bang blob URL moi.
  const applyAvatarFile = (file) => {
    if (!isImageFile(file)) {
      setProfileFeedback({
        type: "error",
        message: "Please upload a valid image file for the avatar.",
      });
      return;
    }

    setSelectedAvatarFile(file);
    setAvatarFileName(file.name);
    setUserInfo((currentInfo) => ({
      ...currentInfo,
      avatar: URL.createObjectURL(file),
    }));
    setProfileFeedback(INITIAL_PROFILE_FEEDBACK);
  };

  // Ham nay dung de cap nhat avatar tam thoi khi user chon anh moi tu may.
  // Nhan vao: event la su kien onChange cua input file avatar.
  // Tac dong: trich file dau tien va chuyen qua helper applyAvatarFile.
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    applyAvatarFile(file);
    event.target.value = "";
  };

  // Ham nay dung de bat hieu ung drag khi anh duoc keo vao dropzone avatar.
  // Nhan vao: event la su kien drag over.
  // Tac dong: chan hanh vi mac dinh va bat state isAvatarDragging.
  const handleAvatarDragOver = (event) => {
    event.preventDefault();
    setIsAvatarDragging(true);
  };

  // Ham nay dung de tat hieu ung drag khi anh roi khoi dropzone avatar.
  // Nhan vao: event la su kien drag leave.
  // Tac dong: chan hanh vi mac dinh va tat state dragging.
  const handleAvatarDragLeave = (event) => {
    event.preventDefault();
    setIsAvatarDragging(false);
  };

  // Ham nay dung de nhan anh keo-tha vao dropzone avatar.
  // Nhan vao: event la su kien drop tu trinh duyet.
  // Tac dong: lay tep anh dau tien, tat dragging va cap nhat preview.
  const handleAvatarDrop = (event) => {
    event.preventDefault();
    setIsAvatarDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    applyAvatarFile(file);
  };

  // Ham nay dung de luu profile user len backend va dong bo lai giao dien ngay sau khi thanh cong.
  // Nhan vao: event la su kien submit cua form profile.
  // Tac dong: build FormData, goi endpoint /api/profile va cap nhat state bang profile moi nhat.
  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setIsProfileSaving(true);

    const payload = new FormData();
    payload.append("fullName", userInfo.fullName);
    payload.append("dob", userInfo.dob);
    payload.append("gender", userInfo.gender);
    payload.append("phone", userInfo.phone);

    if (selectedAvatarFile) {
      payload.append("avatar", selectedAvatarFile);
    }

    const result = await updateCurrentProfile(payload);

    if (!result.success) {
      setProfileFeedback({
        type: "error",
        message: result.message,
      });
      setIsProfileSaving(false);
      return;
    }

    setUserInfo(mapProfileToUserInfo(result.data || {}));
    setSelectedAvatarFile(null);
    setAvatarFileName("");
    setProfileFeedback({
      type: "success",
      message: result.message,
    });
    setIsProfileSaving(false);
  };

  // Ham nay dung de claim Token(2) cho user va nap lai history/active codes ngay sau khi thanh cong.
  // Nhan vao: event la submit cua form claim trong tab Active Codes.
  // Tac dong: goi endpoint claim-token, hien feedback va dong bo dashboard that tu DB.
  const handleClaimTokenSubmit = async (event) => {
    event.preventDefault();

    if (!String(claimTokenValue || "").trim()) {
      setClaimFeedback({
        type: "error",
        message: "Enter your Token(2) before trying to claim a QR code.",
      });
      return;
    }

    setIsClaimingToken(true);
    const result = await claimUserGuestToken(claimTokenValue);

    if (!result.success) {
      setClaimFeedback({
        type: "error",
        message: result.message,
      });
      setIsClaimingToken(false);
      return;
    }

    setClaimFeedback({
      type: "success",
      message: result.message,
    });
    setClaimTokenValue("");
    await loadDashboardData(false);
    setIsClaimingToken(false);
  };

  // Ham nay dung de mo modal xac nhan xoa lich su scan theo item duoc chon.
  // Nhan vao: userHistoryId la ma item lich su can xoa mem.
  // Tac dong: cap nhat state pendingDeleteHistoryId de modal hien ra.
  const requestDeleteHistory = (userHistoryId) => {
    setPendingDeleteHistoryId(String(userHistoryId || "").trim());
  };

  // Ham nay dung de dong modal xac nhan xoa lich su scan.
  // Nhan vao: khong nhan tham so.
  // Tac dong: reset state pendingDeleteHistoryId.
  const cancelDeleteHistory = () => {
    setPendingDeleteHistoryId("");
    setIsDeletingHistory(false);
  };

  // Ham nay dung de xoa mem item lich su scan da duoc user xac nhan.
  // Nhan vao: khong nhan tham so, doc pendingDeleteHistoryId tu state.
  // Tac dong: goi API delete, cap nhat dashboard va dong modal.
  const confirmDeleteHistory = async () => {
    if (!pendingDeleteHistoryId) {
      return;
    }

    setIsDeletingHistory(true);
    const result = await deleteUserScanHistory(pendingDeleteHistoryId);

    if (!result.success) {
      setClaimFeedback({
        type: "error",
        message: result.message,
      });
      setIsDeletingHistory(false);
      return;
    }

    setDashboardData((currentData) => ({
      ...currentData,
      history: currentData.history.filter((item) => item.id !== pendingDeleteHistoryId),
    }));
    setSelectedScan((currentScan) =>
      currentScan?.id === pendingDeleteHistoryId ? null : currentScan,
    );
    setClaimFeedback({
      type: "success",
      message: result.message,
    });
    setPendingDeleteHistoryId("");
    setIsDeletingHistory(false);
  };

  return {
    activeScans,
    activeTab,
    avatarFileName,
    cancelDeleteHistory,
    claimFeedback,
    claimTokenValue,
    confirmDeleteHistory,
    dashboardMessage,
    fileInputRef,
    isAvatarDragging,
    isClaimingToken,
    isDashboardLoading,
    isDeletingHistory,
    isProfileSaving,
    pendingDeleteHistoryId,
    profileFeedback,
    requestDeleteHistory,
    scanHistoryData,
    selectedScan,
    userInfo,
    closeScanDetails: () => setSelectedScan(null),
    handleAvatarChange,
    handleAvatarDragLeave,
    handleAvatarDragOver,
    handleAvatarDrop,
    handleClaimTokenSubmit,
    handleClaimTokenValueChange,
    handleProfileFieldChange,
    handleSaveSettings,
    openScanDetails: setSelectedScan,
    reloadDashboardData: loadDashboardData,
    setActiveTab,
  };
}
