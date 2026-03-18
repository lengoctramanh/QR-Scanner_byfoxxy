const { v4: createUUID } = require("uuid");

const db = require("../config/database");
const accountModel = require("../models/accountModel");
const brandModel = require("../models/brandModel");
const brandRegistrationRequestModel = require("../models/brandRegistrationRequestModel");
const passwordUtil = require("../utils/passwordUtil");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUEST_STATUS = {
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  UNDER_REVIEW: "UNDER_REVIEW",
};

const normalizeContact = (emailOrPhone) => {
  const normalizedValue = String(emailOrPhone || "").trim().toLowerCase();

  if (!normalizedValue) {
    throw new Error("emailOrPhone is required");
  }

  if (EMAIL_PATTERN.test(normalizedValue)) {
    return {
      email: normalizedValue,
      phone: null,
    };
  }

  return {
    email: `phone_${normalizedValue}@qr.local`,
    phone: normalizedValue,
  };
};

const buildAttachmentPlaceholders = (attachments = []) =>
  JSON.stringify(attachments.map((file, index) => `pending-upload://${Date.now()}-${index}-${file.originalname}`));

const sanitizeEmail = (email) => {
  if (!email) {
    return null;
  }

  if (email.startsWith("phone_") && email.endsWith("@qr.local")) {
    return null;
  }

  return email;
};

const sanitizeRequestRow = (requestRow) => ({
  ...requestRow,
  email: sanitizeEmail(requestRow.email),
  attachment_urls: Array.isArray(requestRow.attachment_urls) ? requestRow.attachment_urls : requestRow.attachment_urls ? JSON.parse(requestRow.attachment_urls) : [],
});

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
  async submitRequest(registrationPayload) {
    const connection = await db.getConnection();

    try {
      const contact = normalizeContact(registrationPayload.emailOrPhone);
      const duplicateLookupValue = contact.phone || contact.email;
      const accountExists = await accountModel.checkExist(duplicateLookupValue, {
        executor: connection,
      });
      const taxIdExists = await brandModel.checkTaxIdExists(registrationPayload.taxId, {
        executor: connection,
      });
      const requestConflict = await brandRegistrationRequestModel.checkPendingConflict(
        {
          email: contact.email,
          phone: contact.phone,
          taxId: registrationPayload.taxId,
        },
        { executor: connection },
      );

      if (accountExists) {
        return {
          isValid: false,
          httpStatus: 409,
          message: "The email or phone number already exists in the system.",
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
      const passwordHash = await passwordUtil.hashPassword(registrationPayload.password, reservedAccountId);

      await brandRegistrationRequestModel.createRequest(
        {
          requestId,
          reservedAccountId,
          reservedBrandId,
          fullName: registrationPayload.fullName,
          dob: registrationPayload.dob,
          gender: registrationPayload.gender || null,
          email: contact.email,
          phone: contact.phone,
          passwordHash,
          brandName: registrationPayload.brandName,
          taxId: registrationPayload.taxId,
          website: registrationPayload.website || null,
          industry: registrationPayload.industry || null,
          productCategories: registrationPayload.productCategories || null,
          attachmentUrls: buildAttachmentPlaceholders(registrationPayload.attachments),
          requestStatus: REQUEST_STATUS.PENDING,
        },
        { executor: connection },
      );

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

  async listRequests(filters = {}) {
    try {
      const rows = await brandRegistrationRequestModel.listRequests(filters);
      return {
        isValid: true,
        httpStatus: 200,
        data: rows.map(sanitizeRequestRow),
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
        data: sanitizeRequestRow(requestRow),
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
