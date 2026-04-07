import { useRef, useState } from "react";
import { submitRegistration } from "../services/authService";
import { processFiles, removeFile } from "../utils/fileUtils";
import { validateRegisterData } from "../utils/validators";

export const INITIAL_REGISTER_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dob: "",
  gender: "",
  brandName: "",
  taxId: "",
  industry: "",
  productCategories: "",
  website: "",
  attachments: [],
  termsAccepted: false,
};

// Ham nay dung de quan ly toan bo state va hanh vi cua form dang ky.
// Nhan vao: khong nhan tham so nao.
// Tra ve: state, ref va cac handler de trang Register su dung.
export default function useRegisterForm() {
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState(INITIAL_REGISTER_FORM);
  const [validationErrors, setValidationErrors] = useState({});
  const [formMessage, setFormMessage] = useState("");
  const [formTone, setFormTone] = useState("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Ham nay dung de cap nhat formData theo tung input nguoi dung thao tac.
  // Nhan vao: event la su kien onChange cua input hoac checkbox.
  // Tac dong: cap nhat truong du lieu tuong ung trong formData.
  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setValidationErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
    setFormMessage("");
  };

  // Ham nay dung de doi role dang ky va reset lai danh sach tep dinh kem.
  // Nhan vao: nextRole la role moi ma nguoi dung chon.
  // Tac dong: cap nhat role, xoa attachments va reset o input file.
  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setFormData((prev) => ({
      ...prev,
      attachments: [],
      brandName: nextRole === "brand" ? prev.brandName : "",
      taxId: nextRole === "brand" ? prev.taxId : "",
      industry: nextRole === "brand" ? prev.industry : "",
      productCategories: nextRole === "brand" ? prev.productCategories : "",
      website: nextRole === "brand" ? prev.website : "",
    }));
    setValidationErrors({});
    setFormMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Ham nay dung de xu ly khi nguoi dung chon file tu may tinh.
  // Nhan vao: event la su kien onChange cua input file.
  // Tac dong: dua danh sach file vao utility processFiles va tat trang thai keo tha.
  const handleFileChange = (event) => {
    setIsDragging(false);
    const uploadResult = processFiles(Array.from(event.target.files || []), formData.attachments);
    setFormData((prev) => ({
      ...prev,
      attachments: uploadResult.attachments,
    }));
    setValidationErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.attachments;
      return nextErrors;
    });
    setFormTone(uploadResult.errorMessage ? "error" : "info");
    setFormMessage(uploadResult.errorMessage);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Ham nay dung de bat trang thai keo file vao khu vuc upload.
  // Nhan vao: event la su kien keo file qua vung upload.
  // Tac dong: chan hanh vi mac dinh va bat isDragging.
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // Ham nay dung de tat trang thai drag khi file roi khoi vung upload.
  // Nhan vao: event la su kien drag leave.
  // Tac dong: chan hanh vi mac dinh va tat isDragging.
  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // Ham nay dung de xu ly tep khi nguoi dung tha file vao khu vuc upload.
  // Nhan vao: event la su kien drop chua danh sach file.
  // Tac dong: trich xuat file va dua qua processFiles de cap nhat form.
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const uploadResult = processFiles(Array.from(event.dataTransfer.files || []), formData.attachments);
    setFormData((prev) => ({
      ...prev,
      attachments: uploadResult.attachments,
    }));
    setValidationErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.attachments;
      return nextErrors;
    });
    setFormTone(uploadResult.errorMessage ? "error" : "info");
    setFormMessage(uploadResult.errorMessage);
  };

  // Ham nay dung de xoa mot tep khoi danh sach dinh kem.
  // Nhan vao: indexToRemove la vi tri tep can xoa.
  // Tac dong: cap nhat lai truong attachments trong formData.
  const handleRemoveFile = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      attachments: removeFile(indexToRemove, prev.attachments),
    }));
    setValidationErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.attachments;
      return nextErrors;
    });
    setFormMessage("");
  };

  // Ham nay dung de kiem tra va gui form dang ky len backend.
  // Nhan vao: event la su kien submit cua form.
  // Tac dong: validate du lieu, goi API dang ky va hien thong bao ket qua.
  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validateRegisterData(formData, role);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      setFormTone("error");
      setFormMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    const result = await submitRegistration(formData, role);
    setIsSubmitting(false);

    if (!result.success) {
      setFormTone("error");
      setFormMessage(result.message);
      if (result.errors) {
        setValidationErrors(result.errors);
      }
      return;
    }

    setValidationErrors({});
    setFormTone("success");
    setFormMessage(result.message || "Registration completed successfully.");
    setFormData({
      ...INITIAL_REGISTER_FORM,
      attachments: [],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    role,
    showPassword,
    showConfirmPassword,
    isDragging,
    formData,
    validationErrors,
    formMessage,
    formTone,
    isSubmitting,
    fileInputRef,
    handleChange,
    handleRoleChange,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleSubmit,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),
  };
}
