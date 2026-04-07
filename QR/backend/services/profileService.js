const db = require("../config/database");
const accountModel = require("../models/accountModel");
const brandModel = require("../models/brandModel");
const authService = require("./authService");
const { saveProfileMedia } = require("../utils/profileMediaStorage");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_GENDERS = ["male", "female", "other", "secret"];

// Ham nay dung de cat bo khoang trang va doi chuoi rong thanh null khi can.
// Nhan vao: value la gia tri bat ky tu request va options de dieu khien lower-case/bat buoc.
// Tra ve: chuoi da chuan hoa, null neu rong, hoac nem loi neu bat buoc ma bi thieu.
const normalizeString = (value, options = {}) => {
  const normalizedValue = String(value == null ? "" : value).trim();

  if (!normalizedValue) {
    if (options.required) {
      throw new Error(options.requiredMessage || "A required field is missing.");
    }

    return null;
  }

  return options.lowercase ? normalizedValue.toLowerCase() : normalizedValue;
};

// Ham nay dung de xac minh chuoi ngay YYYY-MM-DD co hop le de luu vao DB hay khong.
// Nhan vao: value la gia tri ngay tu frontend.
// Tra ve: chuoi ngay da trim neu hop le, nguoc lai nem loi.
const normalizeDate = (value, requiredLabel) => {
  const normalizedValue = normalizeString(value, {
    required: true,
    requiredMessage: `${requiredLabel} is required.`,
  });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw new Error(`${requiredLabel} must use the YYYY-MM-DD format.`);
  }

  const parsedDate = new Date(`${normalizedValue}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${requiredLabel} is invalid.`);
  }

  return normalizedValue;
};

// Ham nay dung de chuan hoa gioi tinh ve mot trong cac gia tri hop le hoac null.
// Nhan vao: gender la gia tri gioi tinh frontend gui len.
// Tra ve: gender da chuan hoa, hoac null neu de trong.
const normalizeGender = (gender) => {
  const normalizedValue = normalizeString(gender, {
    lowercase: true,
  });

  if (!normalizedValue) {
    return null;
  }

  if (!ALLOWED_GENDERS.includes(normalizedValue)) {
    throw new Error("Gender selection is invalid.");
  }

  return normalizedValue;
};

// Ham nay dung de kiem tra email moi co dang hop le va co trung voi tai khoan khac hay khong.
// Nhan vao: email da chuan hoa, accountId hien tai va options co the chua executor.
// Tac dong: nem loi neu email khong hop le hoac da bi tai khoan khac su dung.
const validateUniqueEmail = async (email, accountId, options = {}) => {
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Contact email is invalid.");
  }

  const existingAccount = await accountModel.findByEmail(email, options);

  if (existingAccount && existingAccount.account_id !== accountId) {
    throw new Error("This contact email is already used by another account.");
  }
};

// Ham nay dung de kiem tra so dien thoai moi co bi tai khoan khac su dung hay khong.
// Nhan vao: phone la gia tri moi, accountId hien tai va options co the chua executor.
// Tac dong: nem loi neu phone bi trung voi account khac.
const validateUniquePhone = async (phone, accountId, options = {}) => {
  if (!phone) {
    return;
  }

  const existingAccount = await accountModel.findByPhone(phone, options);

  if (existingAccount && existingAccount.account_id !== accountId) {
    throw new Error("This phone number is already used by another account.");
  }
};

// Ham nay dung de kiem tra ma so thue moi co trung voi brand khac hay khong.
// Nhan vao: taxId moi, brandId hien tai va options co the chua executor.
// Tac dong: nem loi neu taxId da ton tai o brand khac.
const validateUniqueTaxId = async (taxId, brandId, options = {}) => {
  const existingBrand = await brandModel.findByTaxId(taxId, options);

  if (existingBrand && existingBrand.brand_id !== brandId) {
    throw new Error("This tax ID is already assigned to another brand.");
  }
};

// Ham nay dung de map response profile chuan tu authService thanh body thong nhat cho endpoint save profile.
// Nhan vao: accountId la ma tai khoan vua cap nhat.
// Tra ve: body success co profile moi nhat de frontend cap nhat state.
const buildUpdatedProfileBody = async (accountId) => {
  const profileResult = await authService.getCurrentProfile(accountId);

  if (!profileResult.isValid) {
    return {
      success: true,
      message: "Profile updated successfully.",
      data: null,
    };
  }

  return {
    success: true,
    message: "Profile updated successfully.",
    data: profileResult.body.data,
  };
};

const profileService = {
  // Ham nay dung de cap nhat profile hien tai cho user hoac brand dang dang nhap.
  // Nhan vao: payload chua accountId, role, body va files tu request multipart.
  // Tra ve: object ket qua nghiep vu de controller tra ve frontend.
  async updateCurrentProfile(payload) {
    const accountId = String(payload.accountId || "").trim();
    const role = String(payload.role || "").trim().toLowerCase();

    if (!accountId) {
      return {
        isValid: false,
        httpStatus: 401,
        message: "Unauthorized.",
      };
    }

    try {
      const account = await accountModel.findByAccountId(accountId);

      if (!account) {
        return {
          isValid: false,
          httpStatus: 404,
          message: "Account not found.",
        };
      }

      const avatarFile = payload.files?.avatar?.[0] || null;
      const logoFile = payload.files?.logo?.[0] || null;

      if (role === "brand") {
        const brandProfile = await brandModel.findByAccountId(accountId);

        if (!brandProfile) {
          return {
            isValid: false,
            httpStatus: 404,
            message: "Brand profile not found.",
          };
        }

        const businessName = normalizeString(payload.body?.businessName, {
          required: true,
          requiredMessage: "Business name is required.",
        });
        const contactEmail = normalizeString(payload.body?.email, {
          required: true,
          requiredMessage: "Contact email is required.",
          lowercase: true,
        });
        const phone = normalizeString(payload.body?.phone);
        const website = normalizeString(payload.body?.website);
        const address = normalizeString(payload.body?.address);
        const taxId = normalizeString(payload.body?.taxId, {
          required: true,
          requiredMessage: "Tax ID is required.",
        });

        if (contactEmail !== account.email) {
          return {
            isValid: false,
            httpStatus: 400,
            message:
              "Changing the contact email is temporarily disabled because sign-in password hashing is currently bound to the existing email.",
          };
        }

        await validateUniqueEmail(contactEmail, accountId);
        await validateUniquePhone(phone, accountId);
        await validateUniqueTaxId(taxId, brandProfile.brand_id);

        const nextAvatarUrl = avatarFile ? await saveProfileMedia(avatarFile, "brandAvatar") : account.avatar_url;
        const nextLogoUrl = logoFile ? await saveProfileMedia(logoFile, "brandLogo") : brandProfile.logo_url;

        const connection = await db.getConnection();

        try {
          await connection.beginTransaction();

          await accountModel.updateAccountProfile(
            {
              accountId,
              fullName: account.full_name,
              dob: account.dob,
              gender: account.gender,
              email: contactEmail,
              phone,
              avatarUrl: nextAvatarUrl,
            },
            { executor: connection },
          );

          await brandModel.updateBrandProfile(
            {
              brandId: brandProfile.brand_id,
              brandName: businessName,
              logoUrl: nextLogoUrl,
              taxId,
              website,
              address,
            },
            { executor: connection },
          );

          await connection.commit();
        } catch (error) {
          await connection.rollback();
          console.error("Service Error (updateCurrentProfile brand transaction):", error);
          return {
            isValid: false,
            httpStatus: 500,
            message: "Unable to save the business profile right now.",
          };
        } finally {
          connection.release();
        }

        return {
          isValid: true,
          httpStatus: 200,
          body: await buildUpdatedProfileBody(accountId),
        };
      }

      const fullName = normalizeString(payload.body?.fullName, {
        required: true,
        requiredMessage: "Full name is required.",
      });
      const dob = normalizeDate(payload.body?.dob, "Date of birth");
      const gender = normalizeGender(payload.body?.gender);
      const phone = normalizeString(payload.body?.phone);

      await validateUniquePhone(phone, accountId);

      const nextAvatarUrl = avatarFile ? await saveProfileMedia(avatarFile, role === "brand" ? "brandAvatar" : "userAvatar") : account.avatar_url;
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        await accountModel.updateAccountProfile(
          {
            accountId,
            fullName,
            dob,
            gender,
            email: account.email,
            phone,
            avatarUrl: nextAvatarUrl,
          },
          { executor: connection },
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        console.error("Service Error (updateCurrentProfile user transaction):", error);
        return {
          isValid: false,
          httpStatus: 500,
          message: "Unable to save the profile right now.",
        };
      } finally {
        connection.release();
      }

      return {
        isValid: true,
        httpStatus: 200,
        body: await buildUpdatedProfileBody(accountId),
      };
    } catch (error) {
      console.error("Service Error (updateCurrentProfile):", error);
      return {
        isValid: false,
        httpStatus: 400,
        message: error.message || "Unable to update the profile right now.",
      };
    }
  },
};

module.exports = profileService;
