import { useRef, useState } from "react";
import { submitRegistration } from "../services/authService";
import { processFiles, removeFile } from "../utils/fileUtils";
import { validateRegisterData } from "../utils/validators";

export const INITIAL_REGISTER_FORM = {
  fullName: "",
  emailOrPhone: "",
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
  agreePolicy: false,
};

export default function useRegisterForm() {
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState(INITIAL_REGISTER_FORM);
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setFormData((prev) => ({
      ...prev,
      attachments: [],
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    setIsDragging(false);
    processFiles(Array.from(event.target.files || []), setFormData, fileInputRef);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(event.dataTransfer.files || []), setFormData, fileInputRef);
  };

  const handleRemoveFile = (indexToRemove) => {
    removeFile(indexToRemove, setFormData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validateRegisterData(formData, role);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    const result = await submitRegistration(formData, role);
    alert(result.message);
  };

  return {
    role,
    showPassword,
    showConfirmPassword,
    isDragging,
    formData,
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
