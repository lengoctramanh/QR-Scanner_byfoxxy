const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const brandModel = require("../models/brandModel");
const brandRegistrationRequestModel = require("../models/brandRegistrationRequestModel");
const { cleanupRegistrationAttachments, mapAttachmentUrlsToDescriptors, saveRegistrationAttachments } = require("../utils/brandRegistrationAttachmentStorage");
const passwordUtil = require("../utils/passwordUtil");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;
const REQUEST_STATUS = {
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  UNDER_REVIEW: "UNDER_REVIEW",
};

// Ham nay dung de bo email gia tao tu phone khi tra du lieu ve API.
// Nhan vao: email la gia tri email dang luu trong DB.
// Tra ve: email that neu hop le, hoac null neu day la email gia.
const sanitizeEmail = (email) => {
  if (!email) {
    return null;
  }

  if (email.startsWith("phone_") && email.endsWith("@qr.local")) {
    return null;
  }

  return email;
};

// Ham nay dung de xac dinh login identifier ma brand se dung sau khi tai khoan duoc tao.
// Nhan vao: requestRow la ban ghi dang ky brand.
// Tra ve: email that, so dien thoai, hoac email placeholder neu khong con lua chon nao khac.
const deriveLoginIdentifier = (requestRow) => sanitizeEmail(requestRow.email) || requestRow.phone || requestRow.email || "--";

// Ham nay dung de tao nhan trang thai cap nhat gan nhat de hien thi tren dashboard admin.
// Nhan vao: requestRow la ban ghi dang ky brand.
// Tra ve: chuoi nhan mo ta hanh dong gan nhat dua tren request_status.
const buildLastUpdatedLabel = (requestRow) => {
  switch (requestRow.request_status) {
    case REQUEST_STATUS.ACCOUNT_CREATED:
      return "Approved";
    case REQUEST_STATUS.REJECTED:
      return "Rejected";
    case REQUEST_STATUS.UNDER_REVIEW:
      return "Under review";
    case REQUEST_STATUS.PENDING:
    default:
      return "Submitted";
  }
};

// Ham nay dung de map du lieu request DB thanh object an toan va de dung cho frontend admin.
// Nhan vao: requestRow la ban ghi request thuan tu DB.
// Tra ve: object da doi ten field, an password hash va bo sung metadata attachments.
const buildRequestResponse = (requestRow) => {
  const sanitizedEmail = sanitizeEmail(requestRow.email);

  return {
    requestId: requestRow.request_id,
    fullName: requestRow.full_name,
    dob: requestRow.dob || null,
    gender: requestRow.gender || null,
    email: sanitizedEmail,
    phone: requestRow.phone || null,
    loginIdentifier: deriveLoginIdentifier(requestRow),
    brandName: requestRow.brand_name,
    taxId: requestRow.tax_id,
    website: requestRow.website || null,
    industry: requestRow.industry || null,
    productCategories: requestRow.product_categories || null,
    requestStatus: requestRow.request_status,
    adminNote: requestRow.admin_note || "",
    reviewedByAdminId: requestRow.reviewed_by_admin_id || null,
    reviewedAt: requestRow.reviewed_at || null,
    createdAt: requestRow.created_at || null,
    lastUpdatedAt: requestRow.reviewed_at || requestRow.created_at || null,
    lastUpdatedLabel: buildLastUpdatedLabel(requestRow),
    attachments: mapAttachmentUrlsToDescriptors(requestRow.attachment_urls),
  };
};

// Ham nay dung de tao thong diep trung lap phu hop theo loai xung dot dang ky.
// Nhan vao: conflictRow la ban ghi xung dot tim thay, taxId la ma so thue dang ky moi.
// Tra ve: chuoi message mo ta nguyen nhan conflict.
const buildConflictMessage = (conflictRow, taxId) => {
  if (!conflictRow) {
    return "A registration with the same information already exists in the system.";
  }

  if (conflictRow.tax_id === taxId) {
    return "Another pending brand registration already uses this tax ID.";
  }

  if (conflictRow.phone) {
    return "This phone number already belongs to a brand registration being reviewed by an admin.";
  }

  return "This email already belongs to a brand registration being reviewed by an admin.";
};

// Ham nay dung de xac minh tai khoan admin dang review request co hop le hay khong.
// Nhan vao: adminAccountId la ma tai khoan admin, options chua executor neu can.
// Tra ve: object ket qua validation kem thong tin admin neu hop le.
const validateAdminReviewer = async (adminAccountId, options = {}) => {
  const adminAccount = await accountModel.findByAccountId(adminAccountId, options);

  if (!adminAccount) {
    return {
      isValid: false,
      message: "The reviewing admin account could not be found.",
    };
  }

  if (adminAccount.role !== "admin") {
    return {
      isValid: false,
      message: "Only admin accounts can review this request.",
    };
  }

  if (adminAccount.status !== "active") {
    return {
      isValid: false,
      message: "The reviewing admin account is not active.",
    };
  }

  return {
    isValid: true,
    adminAccount,
  };
};

const brandRegistrationRequestService = {
  // Ham nay dung de ghi nhan mot bo ho so dang ky brand vao bang request cho admin xu ly.
  // Nhan vao: registrationPayload chua thong tin account, brand va tep dinh kem.
  // Tra ve: object ket qua nghiep vu; co the ghi du lieu moi vao DB.
  async submitRequest(registrationPayload) {
    const connection = await db.getConnection();
    let createdRequestId = null;
    let hasStartedTransaction = false;

    try {
      const normalizedEmail = String(registrationPayload.email || "").trim().toLowerCase();
      const normalizedPhone = String(registrationPayload.phone || "").trim() || null;

      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        return {
          isValid: false,
          httpStatus: 400,
          message: "Email format is invalid.",
        };
      }

      if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) {
        return {
          isValid: false,
          httpStatus: 400,
          message: "Phone number format is invalid.",
        };
      }

      const existingEmailAccount = await accountModel.findByEmail(normalizedEmail, {
        executor: connection,
      });
      const taxIdExists = await brandModel.checkTaxIdExists(registrationPayload.taxId, {
        executor: connection,
      });
      const requestConflict = await brandRegistrationRequestModel.checkPendingConflict(
        {
          email: normalizedEmail,
          phone: normalizedPhone,
          taxId: registrationPayload.taxId,
        },
        { executor: connection },
      );

      if (existingEmailAccount) {
        return {
          isValid: false,
          httpStatus: 409,
          message: "This email already exists in the system.",
        };
      }

      if (normalizedPhone) {
        const existingPhoneAccount = await accountModel.findByPhone(normalizedPhone, {
          executor: connection,
        });

        if (existingPhoneAccount) {
          return {
            isValid: false,
            httpStatus: 409,
            message: "This phone number already exists in the system.",
          };
        };
      }

      if (taxIdExists) {
        return {
          isValid: false,
          httpStatus: 409,
          message: "This tax ID is already assigned to another brand account.",
        };
      }

      if (requestConflict) {
        return {
          isValid: false,
          httpStatus: 409,
          message: buildConflictMessage(requestConflict, registrationPayload.taxId),
        };
      }

      const requestId = createUUID();
      const reservedAccountId = createUUID();
      const reservedBrandId = createUUID();
      const passwordHash = await passwordUtil.hashPassword(registrationPayload.password, normalizedEmail);

      createdRequestId = requestId;
      const attachmentUrls = await saveRegistrationAttachments(requestId, registrationPayload.attachments);

      await connection.beginTransaction();
      hasStartedTransaction = true;

      await brandRegistrationRequestModel.createRequest(
        {
          requestId,
          reservedAccountId,
          reservedBrandId,
          fullName: registrationPayload.fullName,
          dob: registrationPayload.dob,
          gender: registrationPayload.gender || null,
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          brandName: registrationPayload.brandName,
          taxId: registrationPayload.taxId,
          website: registrationPayload.website || null,
          industry: registrationPayload.industry || null,
          productCategories: registrationPayload.productCategories || null,
          attachmentUrls,
          requestStatus: REQUEST_STATUS.PENDING,
        },
        { executor: connection },
      );

      await connection.commit();

      return {
        isValid: true,
        httpStatus: 202,
        message: "The brand registration package was submitted successfully. The account will be created after admin approval.",
        data: {
          requestId,
          brandName: registrationPayload.brandName,
        },
      };
    } catch (error) {
      if (hasStartedTransaction) {
        await connection.rollback();
      }
      if (createdRequestId) {
        await cleanupRegistrationAttachments(createdRequestId);
      }
      console.error("Service Error (submitRequest):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to submit the brand registration package.",
      };
    } finally {
      connection.release();
    }
  },

  // Ham nay dung de lay danh sach yeu cau dang ky brand theo bo loc.
  // Nhan vao: filters co the chua status.
  // Tra ve: object ket qua voi mang request da duoc sanitize.
  async listRequests(filters = {}) {
    try {
      const rows = await brandRegistrationRequestModel.listRequests(filters);
      return {
        isValid: true,
        httpStatus: 200,
        data: rows.map(buildRequestResponse),
      };
    } catch (error) {
      console.error("Service Error (listRequests):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to load the brand registration list.",
      };
    }
  },

  // Ham nay dung de lay chi tiet mot yeu cau dang ky brand theo id.
  // Nhan vao: requestId la ma yeu cau can tra cuu.
  // Tra ve: object ket qua nghiep vu chua du lieu request hoac loi.
  async getRequestById(requestId) {
    try {
      const requestRow = await brandRegistrationRequestModel.findById(requestId);

      if (!requestRow) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "The brand registration request could not be found.",
        };
      }

      return {
        isValid: true,
        httpStatus: 200,
        data: buildRequestResponse(requestRow),
      };
    } catch (error) {
      console.error("Service Error (getRequestById):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to load the brand registration details.",
      };
    }
  },

  // Ham nay dung de tao tai khoan brand that tu mot request da duoc admin duyet.
  // Nhan vao: actionPayload chua requestId, adminAccountId va adminNote.
  // Tra ve: object ket qua nghiep vu; neu thanh cong se ghi du lieu vao accounts, brands va cap nhat request.
  async createAccountFromRequest(actionPayload) {
    const connection = await db.getConnection();

    try {
      const adminValidation = await validateAdminReviewer(actionPayload.adminAccountId, { executor: connection });

      if (!adminValidation.isValid) {
        return {
          isValid: false,
          httpStatus: 400,
          message: adminValidation.message,
        };
      }

      const requestRow = await brandRegistrationRequestModel.findById(actionPayload.requestId, { executor: connection });

      if (!requestRow) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "The brand registration request to approve could not be found.",
        };
      }

      if (requestRow.request_status === REQUEST_STATUS.ACCOUNT_CREATED) {
        return {
          isValid: false,
          httpStatus: 409,
          message: "An account has already been created from this registration request.",
        };
      }

      if (requestRow.request_status === REQUEST_STATUS.REJECTED) {
        return {
          isValid: false,
          httpStatus: 409,
          message: "This registration request was already rejected earlier.",
        };
      }

      await connection.beginTransaction();

      await accountModel.createAccount(
        {
          accountId: requestRow.reserved_account_id,
          fullName: requestRow.full_name,
          dob: requestRow.dob,
          gender: requestRow.gender,
          email: requestRow.email,
          phone: requestRow.phone,
          passwordHash: requestRow.password_hash,
          role: "brand",
          status: "active",
        },
        { executor: connection },
      );

      await brandModel.createBrandProfile(
        {
          brandId: requestRow.reserved_brand_id,
          accountId: requestRow.reserved_account_id,
          brandName: requestRow.brand_name,
          taxId: requestRow.tax_id,
          website: requestRow.website,
          industry: requestRow.industry,
          productCategories: requestRow.product_categories,
          verified: true,
        },
        { executor: connection },
      );

      await brandRegistrationRequestModel.updateStatus(
        {
          requestId: requestRow.request_id,
          requestStatus: REQUEST_STATUS.ACCOUNT_CREATED,
          adminNote: actionPayload.adminNote || "The admin created a brand account from this registration package.",
          reviewedByAdminId: actionPayload.adminAccountId,
        },
        { executor: connection },
      );

      await connection.commit();

      return {
        isValid: true,
        httpStatus: 201,
        message: "The brand account was created successfully. The brand can now sign in to the system.",
        data: {
          requestId: requestRow.request_id,
          accountId: requestRow.reserved_account_id,
          brandId: requestRow.reserved_brand_id,
          brandName: requestRow.brand_name,
          email: sanitizeEmail(requestRow.email),
        },
      };
    } catch (error) {
      await connection.rollback();
      console.error("Service Error (createAccountFromRequest):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to create the brand account from this pending request.",
      };
    } finally {
      connection.release();
    }
  },

  // Ham nay dung de danh dau mot yeu cau dang ky brand la bi tu choi.
  // Nhan vao: actionPayload chua requestId, adminAccountId va adminNote.
  // Tra ve: object ket qua nghiep vu; neu thanh cong se cap nhat trang thai request trong DB.
  async rejectRequest(actionPayload) {
    const connection = await db.getConnection();

    try {
      const adminValidation = await validateAdminReviewer(actionPayload.adminAccountId, { executor: connection });

      if (!adminValidation.isValid) {
        return {
          isValid: false,
          httpStatus: 400,
          message: adminValidation.message,
        };
      }

      const requestRow = await brandRegistrationRequestModel.findById(actionPayload.requestId, { executor: connection });

      if (!requestRow) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "The brand registration request to reject could not be found.",
        };
      }

      if (requestRow.request_status === REQUEST_STATUS.ACCOUNT_CREATED) {
        return {
          isValid: false,
          httpStatus: 409,
          message: "An account has already been created from this request, so it can no longer be rejected.",
        };
      }

      await brandRegistrationRequestModel.updateStatus(
        {
          requestId: requestRow.request_id,
          requestStatus: REQUEST_STATUS.REJECTED,
          adminNote: actionPayload.adminNote || "The admin rejected this brand registration package.",
          reviewedByAdminId: actionPayload.adminAccountId,
        },
        { executor: connection },
      );

      return {
        isValid: true,
        httpStatus: 200,
        message: "The brand registration request has been marked as rejected.",
      };
    } catch (error) {
      console.error("Service Error (rejectRequest):", error);
      return {
        isValid: false,
        httpStatus: 500,
        message: "Unable to reject the brand registration request.",
      };
    } finally {
      connection.release();
    }
  },
};

module.exports = brandRegistrationRequestService;
