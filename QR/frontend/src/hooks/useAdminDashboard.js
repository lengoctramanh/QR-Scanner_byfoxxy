import { useEffect, useMemo, useState } from "react";
import { approveBrandRegistrationRequest, fetchAdminSystemSummary, fetchBrandRegistrationRequestDetail, fetchBrandRegistrationRequests, fetchWebsiteQrConfig, rejectBrandRegistrationRequest, revokeAdminSession, updateWebsiteQrConfig } from "../services/adminService";
import { fetchCurrentUserProfile } from "../services/authService";
import useAuthCheck from "./useAuthCheck";

const ACTIVE_BRAND_REQUEST_STATUSES = ["PENDING", "UNDER_REVIEW"];
const BRAND_STATUS_PRIORITY = {
  UNDER_REVIEW: 0,
  PENDING: 1,
};

const INITIAL_ADMIN_PROFILE = {
  fullName: "Admin",
  email: "",
  gender: "",
  role: "admin",
  status: "active",
  avatarUrl: "",
  lastLoginAt: null,
};

const INITIAL_WEBSITE_QR_STATE = {
  current: null,
  history: [],
};

const INITIAL_SYSTEM_STATE = {
  totals: {
    users: 0,
    brands: 0,
    admins: 0,
    activeSessions: 0,
  },
  users: [],
  brands: [],
  admins: [],
  activeSessions: [],
};

// Ham nay dung de sap xep hang doi brand theo muc uu tien va thoi diem cap nhat gan nhat.
// Nhan vao: leftRequest va rightRequest la hai request dang duoc so sanh.
// Tra ve: so am/duong/0 de Array.sort xac dinh thu tu.
const compareBrandRequests = (leftRequest, rightRequest) => {
  const leftPriority = BRAND_STATUS_PRIORITY[leftRequest.requestStatus] ?? 99;
  const rightPriority = BRAND_STATUS_PRIORITY[rightRequest.requestStatus] ?? 99;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return new Date(rightRequest.lastUpdatedAt || 0) - new Date(leftRequest.lastUpdatedAt || 0);
};

// Ham nay dung de quan ly state, du lieu live va hanh vi cua dashboard admin.
// Nhan vao: khong nhan props, tu goi auth/profile va API admin can thiet.
// Tra ve: toan bo state, derived data va handlers de trang AdminDashboard su dung.
export default function useAdminDashboard() {
  useAuthCheck("admin");

  const [activeTab, setActiveTab] = useState("brands");
  const [adminProfile, setAdminProfile] = useState(INITIAL_ADMIN_PROFILE);
  const [brandRequests, setBrandRequests] = useState([]);
  const [selectedBrandRequestId, setSelectedBrandRequestId] = useState("");
  const [selectedBrandRequestDetail, setSelectedBrandRequestDetail] = useState(null);
  const [websiteQrState, setWebsiteQrState] = useState(INITIAL_WEBSITE_QR_STATE);
  const [websiteUrlDraft, setWebsiteUrlDraft] = useState("");
  const [systemSummary, setSystemSummary] = useState(INITIAL_SYSTEM_STATE);
  const [selectedSystemPanel, setSelectedSystemPanel] = useState("");
  const [activityBanner, setActivityBanner] = useState("Manage live brand onboarding, the public website QR URL, and real system sessions from one place.");
  const [isBrandQueueLoading, setIsBrandQueueLoading] = useState(true);
  const [isBrandDetailLoading, setIsBrandDetailLoading] = useState(false);
  const [activeBrandActionId, setActiveBrandActionId] = useState("");
  const [isWebsiteQrLoading, setIsWebsiteQrLoading] = useState(true);
  const [isWebsiteQrSaving, setIsWebsiteQrSaving] = useState(false);
  const [isSystemLoading, setIsSystemLoading] = useState(true);
  const [activeSessionActionId, setActiveSessionActionId] = useState("");

  // Ham nay dung de nap profile admin hien tai tu endpoint /auth/me.
  // Nhan vao: khong nhan tham so, token duoc axiosClient gui tu dong.
  // Tac dong: cap nhat thong tin sidebar admin hoac thong bao loi banner neu that bai.
  const loadAdminProfile = async () => {
    const result = await fetchCurrentUserProfile();

    if (!result.success) {
      setActivityBanner(result.message || "Unable to load the administrator profile.");
      return;
    }

    const profile = result.data || {};

    setAdminProfile({
      fullName: profile.fullName || "Admin",
      email: profile.email || "",
      gender: profile.gender || "",
      role: profile.role || "admin",
      status: profile.status || "active",
      avatarUrl: profile.avatarUrl || "",
      lastLoginAt: profile.lastLoginAt || null,
    });
  };

  // Ham nay dung de nap danh sach ho so dang ky brand dang cho review tu backend.
  // Nhan vao: khong nhan tham so.
  // Tac dong: cap nhat brandRequests va thong bao banner neu xay ra loi.
  const loadBrandRequests = async () => {
    setIsBrandQueueLoading(true);

    const result = await fetchBrandRegistrationRequests();

    if (!result.success) {
      setBrandRequests([]);
      setActivityBanner(result.message || "Unable to load the brand review queue.");
      setIsBrandQueueLoading(false);
      return;
    }

    setBrandRequests(Array.isArray(result.data) ? result.data : []);
    setIsBrandQueueLoading(false);
  };

  // Ham nay dung de nap cau hinh website QR hien tai va lich su thay doi tu backend.
  // Nhan vao: khong nhan tham so.
  // Tac dong: cap nhat websiteQrState va draft URL dang hien tren form admin.
  const loadWebsiteQrState = async () => {
    setIsWebsiteQrLoading(true);

    const result = await fetchWebsiteQrConfig();

    if (!result.success) {
      setWebsiteQrState(INITIAL_WEBSITE_QR_STATE);
      setWebsiteUrlDraft("");
      setActivityBanner(result.message || "Unable to load the website QR configuration.");
      setIsWebsiteQrLoading(false);
      return;
    }

    const nextState = {
      current: result.data?.current || null,
      history: Array.isArray(result.data?.history) ? result.data.history : [],
    };

    setWebsiteQrState(nextState);
    setWebsiteUrlDraft(nextState.current?.websiteUrl || "");
    setIsWebsiteQrLoading(false);
  };

  // Ham nay dung de nap snapshot he thong that tu DB cho admin dashboard.
  // Nhan vao: khong nhan tham so.
  // Tac dong: cap nhat totals, danh sach user/brand/admin va active sessions.
  const loadSystemSummary = async () => {
    setIsSystemLoading(true);

    const result = await fetchAdminSystemSummary();

    if (!result.success) {
      setSystemSummary(INITIAL_SYSTEM_STATE);
      setActivityBanner(result.message || "Unable to load the live system summary.");
      setIsSystemLoading(false);
      return;
    }

    setSystemSummary({
      totals: result.data?.totals || INITIAL_SYSTEM_STATE.totals,
      users: Array.isArray(result.data?.users) ? result.data.users : [],
      brands: Array.isArray(result.data?.brands) ? result.data.brands : [],
      admins: Array.isArray(result.data?.admins) ? result.data.admins : [],
      activeSessions: Array.isArray(result.data?.activeSessions) ? result.data.activeSessions : [],
    });
    setIsSystemLoading(false);
  };

  useEffect(() => {
    const bootstrapTimer = window.setTimeout(() => {
      void loadAdminProfile();
      void loadBrandRequests();
      void loadWebsiteQrState();
      void loadSystemSummary();
    }, 0);

    return () => {
      window.clearTimeout(bootstrapTimer);
    };
  }, []);

  const sortedBrandRequests = useMemo(() => brandRequests.filter((requestRow) => ACTIVE_BRAND_REQUEST_STATUSES.includes(requestRow.requestStatus)).sort(compareBrandRequests), [brandRequests]);

  const activeSessions = systemSummary.activeSessions;
  const totalUsers = systemSummary.totals.users || systemSummary.users.length;
  const totalBrands = systemSummary.totals.brands || systemSummary.brands.length;
  const totalAdmins = systemSummary.totals.admins || systemSummary.admins.length;
  const totalActiveSessions = systemSummary.totals.activeSessions || systemSummary.activeSessions.length;

  // Ham nay dung de mo modal review va nap chi tiet ho so brand da chon.
  // Nhan vao: requestId la ma request can xem chi tiet.
  // Tac dong: cap nhat state modal va fetch du lieu detail moi nhat tu backend.
  const openBrandReview = async (requestId) => {
    setSelectedBrandRequestId(requestId);
    setSelectedBrandRequestDetail(null);
    setIsBrandDetailLoading(true);

    const result = await fetchBrandRegistrationRequestDetail(requestId);

    if (!result.success) {
      setActivityBanner(result.message || "Unable to load the selected brand request.");
      setIsBrandDetailLoading(false);
      return;
    }

    setSelectedBrandRequestDetail(result.data || null);
    setIsBrandDetailLoading(false);
  };

  // Ham nay dung de dong modal review hien tai cua request brand.
  // Nhan vao: khong nhan tham so.
  // Tac dong: reset state request dang duoc xem chi tiet.
  const closeBrandReview = () => {
    setSelectedBrandRequestId("");
    setSelectedBrandRequestDetail(null);
    setIsBrandDetailLoading(false);
  };

  // Ham nay dung de mo modal thong ke cho users, brands hoac admins.
  // Nhan vao: panelKey la users, brands hoac admins.
  // Tac dong: cap nhat loai danh sach dang duoc xem chi tiet.
  const openSystemPanel = (panelKey) => {
    setSelectedSystemPanel(panelKey);
  };

  // Ham nay dung de dong modal chi tiet thong ke he thong.
  // Nhan vao: khong nhan tham so.
  // Tac dong: reset selectedSystemPanel.
  const closeSystemPanel = () => {
    setSelectedSystemPanel("");
  };

  // Ham nay dung de xu ly approve request brand va tao tai khoan brand that.
  // Nhan vao: requestId la ma request can approve.
  // Tac dong: goi API tao tai khoan, refresh queue va dong modal neu can.
  const handleApproveBrandRequest = async (requestId) => {
    setActiveBrandActionId(requestId);

    const result = await approveBrandRegistrationRequest(requestId);

    if (!result.success) {
      setActivityBanner(result.message || "Unable to approve the brand registration request.");
      setActiveBrandActionId("");
      return;
    }

    setActivityBanner(result.message || "The brand account was created successfully.");
    setActiveBrandActionId("");

    if (selectedBrandRequestId === requestId) {
      closeBrandReview();
    }

    await Promise.all([loadBrandRequests(), loadSystemSummary()]);
  };

  // Ham nay dung de tu choi request brand va dong bo lai hang doi review.
  // Nhan vao: requestId la ma request can reject.
  // Tac dong: goi API reject, refresh queue va dong modal neu request dang mo.
  const handleRejectBrandRequest = async (requestId) => {
    setActiveBrandActionId(requestId);

    const result = await rejectBrandRegistrationRequest(requestId);

    if (!result.success) {
      setActivityBanner(result.message || "Unable to reject the brand registration request.");
      setActiveBrandActionId("");
      return;
    }

    setActivityBanner(result.message || "The brand registration request was rejected.");
    setActiveBrandActionId("");

    if (selectedBrandRequestId === requestId) {
      closeBrandReview();
    }

    await loadBrandRequests();
  };

  // Ham nay dung de cap nhat gia tri URL dang nhap trong form website QR cua admin.
  // Nhan vao: nextValue la chuoi URL moi vua thay doi tren input.
  // Tac dong: dong bo state websiteUrlDraft cho form.
  const handleWebsiteUrlDraftChange = (nextValue) => {
    setWebsiteUrlDraft(nextValue);
  };

  // Ham nay dung de luu URL website moi, sinh QR va refresh lich su phien ban.
  // Nhan vao: khong nhan tham so, doc websiteUrlDraft tu state hien tai.
  // Tac dong: goi API luu website QR, cap nhat banner va state preview moi nhat.
  const handleSaveWebsiteQr = async () => {
    if (!String(websiteUrlDraft || "").trim()) {
      setActivityBanner("Enter the main website URL before generating the QR.");
      return;
    }

    setIsWebsiteQrSaving(true);

    const result = await updateWebsiteQrConfig({
      websiteUrl: websiteUrlDraft,
    });

    if (!result.success) {
      setActivityBanner(result.message || "Unable to save the website QR configuration.");
      setIsWebsiteQrSaving(false);
      return;
    }

    const nextState = {
      current: result.data?.current || null,
      history: Array.isArray(result.data?.history) ? result.data.history : [],
    };

    setWebsiteQrState(nextState);
    setWebsiteUrlDraft(nextState.current?.websiteUrl || websiteUrlDraft);
    setActivityBanner(result.message || "The website QR configuration was updated.");
    setIsWebsiteQrSaving(false);
  };

  // Ham nay dung de thu hoi mot session dang hoat dong trong bang system sessions.
  // Nhan vao: sessionId la ma session can revoke.
  // Tac dong: goi API backend, refresh lai snapshot va cap nhat banner.
  const handleRevokeSession = async (sessionId) => {
    setActiveSessionActionId(sessionId);

    const result = await revokeAdminSession(sessionId);

    if (!result.success) {
      setActivityBanner(result.message || "Unable to revoke the selected session.");
      setActiveSessionActionId("");
      return;
    }

    setActivityBanner(result.message || `Session ${sessionId} was revoked.`);
    setActiveSessionActionId("");
    await loadSystemSummary();
  };

  return {
    activeBrandActionId,
    activeSessionActionId,
    activeSessions,
    activeTab,
    activityBanner,
    adminProfile,
    closeBrandReview,
    closeSystemPanel,
    handleApproveBrandRequest,
    handleRejectBrandRequest,
    handleRevokeSession,
    handleSaveWebsiteQr,
    handleWebsiteUrlDraftChange,
    isBrandDetailLoading,
    isBrandQueueLoading,
    isSystemLoading,
    isWebsiteQrLoading,
    isWebsiteQrSaving,
    openBrandReview,
    openSystemPanel,
    selectedBrandRequestDetail,
    selectedBrandRequestId,
    selectedSystemPanel,
    setActiveTab,
    sortedBrandRequests,
    totalActiveSessions,
    totalAdmins,
    totalBrands,
    totalUsers,
    websiteQrCurrent: websiteQrState.current,
    websiteQrHistory: websiteQrState.history,
    websiteQrUrlDraft: websiteUrlDraft,
    websiteQrVersionCount: websiteQrState.current?.changeNumber || 0,
    systemAdmins: systemSummary.admins,
    systemBrands: systemSummary.brands,
    systemUsers: systemSummary.users,
  };
}
