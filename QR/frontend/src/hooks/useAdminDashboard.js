import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUserProfile } from "../services/authService";
import { approveBrandRegistrationRequest, fetchBrandRegistrationRequestDetail, fetchBrandRegistrationRequests, rejectBrandRegistrationRequest } from "../services/adminService";
import useAuthCheck from "./useAuthCheck";
import { INITIAL_ACTIVE_SESSIONS, INITIAL_APPROVAL_REQUESTS, INITIAL_QR_CODE_REQUESTS, INITIAL_QR_OVERVIEW } from "../data/adminDashboardData";

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
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [qrFilter, setQrFilter] = useState("ALL");
  const [approvalRequests, setApprovalRequests] = useState(INITIAL_APPROVAL_REQUESTS);
  const [qrCodeRequests, setQrCodeRequests] = useState(INITIAL_QR_CODE_REQUESTS);
  const [qrOverviewRows] = useState(INITIAL_QR_OVERVIEW);
  const [activeSessions, setActiveSessions] = useState(INITIAL_ACTIVE_SESSIONS);
  const [adminProfile, setAdminProfile] = useState(INITIAL_ADMIN_PROFILE);
  const [brandRequests, setBrandRequests] = useState([]);
  const [selectedBrandRequestId, setSelectedBrandRequestId] = useState("");
  const [selectedBrandRequestDetail, setSelectedBrandRequestDetail] = useState(null);
  const [activityBanner, setActivityBanner] = useState("Review live brand onboarding requests and manage approval decisions from one place.");
  const [isBrandQueueLoading, setIsBrandQueueLoading] = useState(true);
  const [isBrandDetailLoading, setIsBrandDetailLoading] = useState(false);
  const [activeBrandActionId, setActiveBrandActionId] = useState("");

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

  useEffect(() => {
    loadAdminProfile();
    loadBrandRequests();
  }, []);

  const sortedBrandRequests = useMemo(
    () =>
      brandRequests
        .filter((requestRow) => ACTIVE_BRAND_REQUEST_STATUSES.includes(requestRow.requestStatus))
        .sort(compareBrandRequests),
    [brandRequests],
  );

  const filteredQrRows = qrFilter === "ALL" ? qrOverviewRows : qrOverviewRows.filter((item) => item.status === qrFilter);
  const suspiciousQrCount = qrOverviewRows.filter((item) => item.status === "SUSPICIOUS").length;
  const pendingApprovalCount = approvalRequests.filter((item) => item.status === "PENDING").length + qrCodeRequests.filter((item) => item.status === "PENDING" || item.status === "PROCESSING").length;
  const activeAdminSessions = activeSessions.filter((item) => item.role === "admin").length;
  const totalPublicScans = qrOverviewRows.reduce((total, item) => total + item.total_public_scans, 0);

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

    await loadBrandRequests();
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

  // Ham nay dung de cap nhat ket qua xu ly cho approval request mock trong tab approval.
  // Nhan vao: approvalId la ma request va nextStatus la trang thai moi.
  // Tac dong: sua state approvalRequests va thong bao banner hoat dong.
  const handleApprovalDecision = (approvalId, nextStatus) => {
    setApprovalRequests((currentRows) =>
      currentRows.map((row) =>
        row.approval_id === approvalId
          ? {
              ...row,
              status: nextStatus,
              confirmed_at: new Date().toISOString(),
              rejection_reason: nextStatus === "REJECTED" ? "Mock reason: the proposed change does not have enough supporting evidence yet." : null,
            }
          : row,
      ),
    );
    setActivityBanner(`Approval request ${approvalId} moved to ${nextStatus}.`);
  };

  // Ham nay dung de xu ly cac yeu cau phat hanh QR mock trong tab request.
  // Nhan vao: requestId la ma yeu cau QR va nextStatus la ket qua admin chon.
  // Tac dong: cap nhat state qrCodeRequests va thong diep banner.
  const handleQrRequestDecision = (requestId, nextStatus) => {
    setQrCodeRequests((currentRows) =>
      currentRows.map((row) =>
        row.request_id === requestId
          ? {
              ...row,
              status: nextStatus,
              processed_at: new Date().toISOString(),
              admin_note: nextStatus === "REJECTED" ? "Mock note: the import file does not match the template format yet." : "Mock note: the admin team accepted and is processing this request.",
            }
          : row,
      ),
    );
    setActivityBanner(`QR request ${requestId} moved to ${nextStatus}.`);
  };

  // Ham nay dung de thu hoi mot session dang hoat dong trong bang system sessions.
  // Nhan vao: sessionId la ma session can revoke.
  // Tac dong: xoa session khoi state va cap nhat banner.
  const handleRevokeSession = (sessionId) => {
    setActiveSessions((currentRows) => currentRows.filter((row) => row.session_id !== sessionId));
    setActivityBanner(`Session ${sessionId} was revoked.`);
  };

  return {
    activeAdminSessions,
    activeBrandActionId,
    activeSessions,
    activeTab,
    activityBanner,
    adminProfile,
    approvalRequests,
    closeBrandReview,
    filteredQrRows,
    handleApprovalDecision,
    handleApproveBrandRequest,
    handleQrRequestDecision,
    handleRejectBrandRequest,
    handleRevokeSession,
    isBrandDetailLoading,
    isBrandQueueLoading,
    openBrandReview,
    pendingApprovalCount,
    qrCodeRequests,
    qrFilter,
    qrOverviewRows,
    selectedBrandRequestDetail,
    selectedBrandRequestId,
    selectedRequest,
    setActiveTab,
    setQrFilter,
    setSelectedRequest,
    sortedBrandRequests,
    suspiciousQrCount,
    totalPublicScans,
  };
}
