const path = require("node:path");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;
const HTTPS_URL_PATTERN = /^https:\/\/[^\s]+$/i;
const ALLOWED_GENDERS = new Set(["male", "female", "other", "secret"]);
const ALLOWED_ROLES = new Set(["user", "brand"]);
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"]);

// Ham nay dung de chuan hoa chuoi nhap vao de tranh loi do khoang trang dau/cuoi.
// Nhan vao: value co the la bat ky kieu du lieu nao.
// Tra ve: chuoi da trim.
const normalizeString = (value) => String(value || "").trim();

// Ham nay dung de quy doi gia tri checkbox/form-data ve boolean that.
// Nhan vao: value la gia tri tu form, co the la true/false, on/off, 1/0...
// Tra ve: true neu gia tri duoc xem la da dong y.
const normalizeBoolean = (value) => ["true", "1", "on", "yes"].includes(String(value || "").trim().toLowerCase());

// Ham nay dung de phan tich chuoi ngay yyyy-mm-dd thanh Date de validate.
// Nhan vao: dateValue tu frontend.
// Tra ve: doi tuong Date hop le hoac null neu parse that bai.
const parseIsoDate = (dateValue) => {
  const normalizedDate = normalizeString(dateValue);

  if (!/^\d{4}-\d{2}-\d{2}$/u.test(normalizedDate)) {
    return null;
  }

  const parsedDate = new Date(`${normalizedDate}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// Ham nay dung de tinh mien DOB hop le: khong o tuong lai, khong qua tre va khong qua 100 nam.
// Nhan vao: khong nhan tham so.
// Tra ve: object chua minDate va maxDate tinh tu ngay hien tai.
const getAllowedDobRange = () => {
  const today = new Date();
  const minDate = new Date(today);
  const maxDate = new Date(today);

  minDate.setFullYear(today.getFullYear() - 100);
  maxDate.setFullYear(today.getFullYear() - 5);

  return {
    minDate,
    maxDate,
  };
};

// Ham nay dung de validate payload dang ky user/brand theo rule business hien tai.
// Nhan vao: payload tu request body va files dinh kem neu role la brand.
// Tra ve: object gom isValid, errors, message dau tien va du lieu da normalize.
const validateRegistrationPayload = (payload, files = []) => {
  const errors = {};
  const normalizedRole = normalizeString(payload.role).toLowerCase();
  const fullName = normalizeString(payload.fullName);
  const email = normalizeString(payload.email).toLowerCase();
  const phone = normalizeString(payload.phone) || null;
  const dob = normalizeString(payload.dob);
  const gender = normalizeString(payload.gender).toLowerCase();
  const password = String(payload.password || "");
  const confirmPassword = String(payload.confirmPassword || "");
  const brandName = normalizeString(payload.brandName);
  const taxId = normalizeString(payload.taxId);
  const productCategories = normalizeString(payload.productCategories);
  const industry = normalizeString(payload.industry);
  const website = normalizeString(payload.website);
  const termsAccepted = normalizeBoolean(payload.termsAccepted);
  const parsedDob = parseIsoDate(dob);
  const { minDate, maxDate } = getAllowedDobRange();

  if (!ALLOWED_ROLES.has(normalizedRole)) {
    errors.role = "Invalid account role.";
  }

  if (!fullName) {
    errors.fullName = "Full name cannot be empty.";
  } else if (fullName.length > 100) {
    errors.fullName = "Full name must not exceed 100 characters.";
  }

  if (!email) {
    errors.email = "Email cannot be empty.";
  } else if (email.length > 100) {
    errors.email = "Email must not exceed 100 characters.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email format is invalid.";
  }

  if (phone) {
    if (phone.length > 20) {
      errors.phone = "Phone number must not exceed 20 characters.";
    } else if (!PHONE_PATTERN.test(phone)) {
      errors.phone = "Phone number format is invalid.";
    }
  }

  if (!parsedDob || parsedDob > maxDate || parsedDob < minDate) {
    errors.dob = "Date of birth is not realistic.";
  }

  if (!gender) {
    errors.gender = "Gender is required.";
  } else if (!ALLOWED_GENDERS.has(gender)) {
    errors.gender = "Gender selection is invalid.";
  }

  if (!password.trim()) {
    errors.password = "Password cannot be empty.";
  } else if (password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = "Confirm password cannot be empty.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!termsAccepted) {
    errors.termsAccepted = "You must agree to the Terms of Service and Privacy Policy.";
  }

  if (normalizedRole === "brand") {
    if (!brandName) {
      errors.brandName = "Brand name cannot be empty.";
    } else if (brandName.length > 300) {
      errors.brandName = "Brand name must not exceed 300 characters.";
    }

    if (!taxId) {
      errors.taxId = "Tax ID cannot be empty.";
    } else if (taxId.length > 50) {
      errors.taxId = "Tax ID must not exceed 50 characters.";
    }

    if (!productCategories) {
      errors.productCategories = "Product categories cannot be empty.";
    } else if (productCategories.length > 100) {
      errors.productCategories = "Product categories must not exceed 100 characters.";
    }

    if (!industry) {
      errors.industry = "Industry cannot be empty.";
    } else if (industry.length > 100) {
      errors.industry = "Industry must not exceed 100 characters.";
    }

    if (website && !HTTPS_URL_PATTERN.test(website)) {
      errors.website = "Website must start with https://";
    }

    if (!files.length) {
      errors.attachments = "At least 1 verification document is required.";
    } else if (files.length > 10) {
      errors.attachments = "You can upload up to 10 verification documents.";
    } else {
      const hasUnsupportedFile = files.some((file) => !ALLOWED_ATTACHMENT_EXTENSIONS.has(path.extname(file.originalname || "").toLowerCase()));

      if (hasUnsupportedFile) {
        errors.attachments = "Only PDF, Word, Excel, CSV, PNG and JPG files are supported.";
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    message: Object.values(errors)[0] || "Registration payload is valid.",
    normalizedData: {
      role: normalizedRole,
      fullName,
      email,
      phone,
      dob,
      gender,
      password,
      confirmPassword,
      brandName,
      taxId,
      productCategories,
      industry,
      website,
      termsAccepted,
    },
  };
};

module.exports = {
  validateRegistrationPayload,
};
