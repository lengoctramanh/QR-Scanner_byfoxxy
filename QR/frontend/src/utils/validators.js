const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,19}$/;
const HTTPS_URL_PATTERN = /^https:\/\/[^\s]+$/i;

const parseIsoDate = (dateValue) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || "").trim())) {
    return null;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

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

// Ham nay dung de kiem tra du lieu form dang ky truoc khi gui len backend.
// Nhan vao: data la object du lieu form, role la vai tro dang ky hien tai.
// Tra ve: object gom isValid, errors va message dau tien cho UI.
export const validateRegisterData = (data, role) => {
  const errors = {};
  const { minDate, maxDate } = getAllowedDobRange();
  const parsedDob = parseIsoDate(data.dob);

  if (!String(data.fullName || "").trim()) {
    errors.fullName = "Full name cannot be empty.";
  } else if (String(data.fullName).trim().length > 100) {
    errors.fullName = "Full name must not exceed 100 characters.";
  }

  if (!String(data.email || "").trim()) {
    errors.email = "Email cannot be empty.";
  } else if (String(data.email).trim().length > 100) {
    errors.email = "Email must not exceed 100 characters.";
  } else if (!EMAIL_PATTERN.test(String(data.email).trim())) {
    errors.email = "Email format is invalid.";
  }

  if (String(data.phone || "").trim()) {
    if (String(data.phone).trim().length > 20) {
      errors.phone = "Phone number must not exceed 20 characters.";
    } else if (!PHONE_PATTERN.test(String(data.phone).trim())) {
      errors.phone = "Phone number format is invalid.";
    }
  }

  if (!parsedDob || parsedDob < minDate || parsedDob > maxDate) {
    errors.dob = "Date of birth is not realistic.";
  }

  if (!String(data.gender || "").trim()) {
    errors.gender = "Gender is required.";
  }

  if (!String(data.password || "").trim()) {
    errors.password = "Password cannot be empty.";
  } else if (String(data.password).length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }

  if (!String(data.confirmPassword || "").trim()) {
    errors.confirmPassword = "Confirm password cannot be empty.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!data.termsAccepted) {
    errors.termsAccepted = "You must agree to the Terms of Service and Privacy Policy.";
  }

  if (role === "brand") {
    if (!String(data.brandName || "").trim()) {
      errors.brandName = "Brand name cannot be empty.";
    } else if (String(data.brandName).trim().length > 300) {
      errors.brandName = "Brand name must not exceed 300 characters.";
    }

    if (!String(data.taxId || "").trim()) {
      errors.taxId = "Tax ID cannot be empty.";
    } else if (String(data.taxId).trim().length > 50) {
      errors.taxId = "Tax ID must not exceed 50 characters.";
    }

    if (!String(data.productCategories || "").trim()) {
      errors.productCategories = "Product categories cannot be empty.";
    } else if (String(data.productCategories).trim().length > 100) {
      errors.productCategories = "Product categories must not exceed 100 characters.";
    }

    if (!String(data.industry || "").trim()) {
      errors.industry = "Industry cannot be empty.";
    } else if (String(data.industry).trim().length > 100) {
      errors.industry = "Industry must not exceed 100 characters.";
    }

    if (String(data.website || "").trim() && !HTTPS_URL_PATTERN.test(String(data.website).trim())) {
      errors.website = "Website must start with https://";
    }

    if (!Array.isArray(data.attachments) || data.attachments.length === 0) {
      errors.attachments = "At least 1 verification document is required.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    message: Object.values(errors)[0] || "Validation successful.",
  };
};
