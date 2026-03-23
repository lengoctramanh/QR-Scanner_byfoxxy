const accountSessionModel = require("../models/accountSessionModel");
const adminSystemModel = require("../models/adminSystemModel");

// Ham nay dung de format mot dong user cho frontend admin ma khong lo thong tin nhay cam thua.
// Nhan vao: row la ket qua SQL tu adminSystemModel.listUsers.
// Tra ve: object gon gon phuc vu modal/tong quan.
const mapUserSummary = (row = {}) => ({
  fullName: row.full_name || "User",
  gender: row.gender || "secret",
  status: row.status || "pending",
  lastLoginAt: row.last_login_at || null,
  createdAt: row.created_at || null,
});

// Ham nay dung de map mot dong brand thanh object summary cho dashboard admin.
// Nhan vao: row la ket qua SQL tu adminSystemModel.listBrands.
// Tra ve: object de render chi tiet brand trong modal.
const mapBrandSummary = (row = {}) => ({
  brandName: row.brand_name || "Brand",
  ownerName: row.owner_name || "Pending owner",
  taxId: row.tax_id || "Pending update",
  email: row.email || "Pending update",
  status: row.status || "pending",
  website: row.website || "",
  verificationStatus: row.verification_status || "PENDING_REVIEW",
  verified: Boolean(row.verified),
  lastLoginAt: row.last_login_at || null,
  createdAt: row.created_at || null,
});

// Ham nay dung de map mot dong admin thanh object summary de frontend hien thi.
// Nhan vao: row la ket qua SQL tu adminSystemModel.listAdmins.
// Tra ve: object summary admin.
const mapAdminSummary = (row = {}) => ({
  fullName: row.full_name || "Admin",
  gender: row.gender || "secret",
  status: row.status || "pending",
  lastLoginAt: row.last_login_at || null,
  createdAt: row.created_at || null,
});

// Ham nay dung de map mot dong session live thanh object frontend de admin de doc.
// Nhan vao: row la ket qua SQL tu accountSessionModel.listActiveSessions.
// Tra ve: object session chua thong tin can thiet.
const mapSessionSummary = (row = {}) => ({
  session_id: row.session_id,
  account_id: row.account_id,
  full_name: row.full_name || "Account",
  email: row.email || "",
  role: row.role || "user",
  status: row.status || "pending",
  device_info: row.device_info || "Unknown device",
  device_type: row.device_type || "unknown",
  ip_at_login: row.ip_at_login || "Unknown IP",
  location_at_login: row.location_at_login || "Unknown location",
  session_created: row.session_created || null,
  last_active_at: row.last_active_at || null,
  expires_at: row.expires_at || null,
  minutes_until_expire: Number(row.minutes_until_expire ?? 0),
});

const adminSystemService = {
  // Ham nay dung de gom snapshot he thong that tu DB cho dashboard admin.
  // Nhan vao: khong nhan tham so.
  // Tra ve: body chua tong users, brands, admins va active sessions.
  async getSystemSummary() {
    try {
      const [users, brands, admins, activeSessions] = await Promise.all([
        adminSystemModel.listUsers(),
        adminSystemModel.listBrands(),
        adminSystemModel.listAdmins(),
        accountSessionModel.listActiveSessions(),
      ]);

      const mappedUsers = users.map(mapUserSummary);
      const mappedBrands = brands.map(mapBrandSummary);
      const mappedAdmins = admins.map(mapAdminSummary);
      const mappedSessions = activeSessions.map(mapSessionSummary);

      return {
        isValid: true,
        httpStatus: 200,
        body: {
          success: true,
          data: {
            totals: {
              users: mappedUsers.length,
              brands: mappedBrands.length,
              admins: mappedAdmins.length,
              activeSessions: mappedSessions.length,
            },
            users: mappedUsers,
            brands: mappedBrands,
            admins: mappedAdmins,
            activeSessions: mappedSessions,
          },
        },
      };
    } catch (error) {
      console.error("Service Error (getSystemSummary):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to load the system summary right now.",
      };
    }
  },

  // Ham nay dung de revoke mot session dang hoat dong tu dashboard admin.
  // Nhan vao: sessionId can revoke va adminAccountId de ghi ly do gon hon.
  // Tra ve: ket qua nghiep vu cho controller.
  async revokeSession(sessionId, adminAccountId) {
    const normalizedSessionId = String(sessionId || "").trim();
    const normalizedAdminAccountId = String(adminAccountId || "").trim();

    if (!normalizedSessionId) {
      return {
        isValid: false,
        httpStatus: 400,
        message: "A session ID is required.",
      };
    }

    try {
      const revoked = await accountSessionModel.revokeSessionById(
        normalizedSessionId,
        normalizedAdminAccountId
          ? `Revoked by admin ${normalizedAdminAccountId}.`
          : "Revoked by admin.",
      );

      if (!revoked) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "The selected session does not exist or has already been revoked.",
        };
      }

      return {
        isValid: true,
        httpStatus: 200,
        body: {
          success: true,
          message: `Session ${normalizedSessionId} was revoked successfully.`,
          data: {
            sessionId: normalizedSessionId,
          },
        },
      };
    } catch (error) {
      console.error("Service Error (revokeSession):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to revoke the selected session right now.",
      };
    }
  },
};

module.exports = adminSystemService;
