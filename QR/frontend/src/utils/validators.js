export const validateRegisterData = (data, role) => {
  const {
    password,
    confirmPassword,
    emailOrPhone,
    fullName,
    dob,
    gender,
    brandName,
    taxId,
    industry,
    website,
    attachments,
    agreePolicy,
  } = data;

  const minLength = 8;
  const maxLength = 20;

  if (!fullName || fullName.trim().length === 0) {
    return { isValid: false, message: "Full name cannot be empty!" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,11}$/;

  if (!emailRegex.test(emailOrPhone) && !phoneRegex.test(emailOrPhone)) {
    return { isValid: false, message: "Invalid email or phone number!" };
  }

  if (!dob) {
    return { isValid: false, message: "Please select your date of birth!" };
  }

  if (!password || password.length < minLength || password.length > maxLength) {
    return {
      isValid: false,
      message: `Password must be between ${minLength} and ${maxLength} characters!`,
    };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: "Confirm password does not match!" };
  }

  if (role === "user" && !gender) {
    return { isValid: false, message: "Please select your gender!" };
  }

  if (role === "brand") {
    if (!brandName || brandName.trim().length === 0) {
      return { isValid: false, message: "Brand Name cannot be empty!" };
    }

    if (!taxId || taxId.trim().length === 0) {
      return { isValid: false, message: "Tax ID is required for business!" };
    }

    if (!industry) {
      return { isValid: false, message: "Please select an industry!" };
    }

    if (website && website.trim().length > 0) {
      const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

      if (!urlPattern.test(website)) {
        return { isValid: false, message: "Invalid website URL format!" };
      }
    }

    if (!attachments || attachments.length === 0) {
      return {
        isValid: false,
        message: "Please upload at least 1 business document!",
      };
    }
  }

  if (!agreePolicy) {
    return {
      isValid: false,
      message: "You must agree to the Terms of Service and Privacy Policy!",
    };
  }

  return { isValid: true, message: "Validation successful!" };
};
