import { useRef, useState } from "react";
import useAuthCheck from "./useAuthCheck";

const INITIAL_BRAND_INFO = {
  fullName: "Name",
  businessName: "Acme Corporation",
  taxId: "0123456789",
  email: "contact@acme.com",
  address: "123 Tech Valley, Silicon City",
  website: "https://acmecorp.com",
  logo: "https://cdn-icons-png.flaticon.com/512/2933/2933245.png",
};

const INITIAL_PASSWORDS = {
  new: "",
  confirm: "",
};

const INITIAL_SHOW_PASSWORDS = {
  new: false,
  confirm: false,
};

const INITIAL_QR_FORM = {
  productName: "",
  qrCodeString: "",
  scanLimit: 5,
  isSystemGenerated: false,
};

const EXCEL_FILE_EXTENSIONS = [".xls", ".xlsx", ".csv"];

export default function useBrandDashboard() {
  useAuthCheck("brand");

  const [activeTab, setActiveTab] = useState("create");
  const [isDragging, setIsDragging] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [brandInfo, setBrandInfo] = useState(INITIAL_BRAND_INFO);
  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [showPasswords, setShowPasswords] = useState(INITIAL_SHOW_PASSWORDS);
  const [qrForm, setQrForm] = useState(INITIAL_QR_FORM);

  const logoInputRef = useRef(null);
  const excelInputRef = useRef(null);

  const setBrandInfoField = (field, value) => {
    setBrandInfo((currentInfo) => ({
      ...currentInfo,
      [field]: value,
    }));
  };

  const setPasswordField = (field, value) => {
    setPasswords((currentPasswords) => ({
      ...currentPasswords,
      [field]: value,
    }));
  };

  const setQrFormField = (field, value) => {
    setQrForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBrandInfo((currentInfo) => ({
      ...currentInfo,
      logo: URL.createObjectURL(file),
    }));
  };

  const handleExcelDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleExcelDragLeave = () => {
    setIsDragging(false);
  };

  const handleExcelDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file && EXCEL_FILE_EXTENSIONS.some((extension) => file.name.endsWith(extension))) {
      setExcelFile(file);
      return;
    }

    alert("Please upload a valid Excel file (.xls, .xlsx, .csv).");
  };

  const handleExcelChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
  };

  const handleManualQrSubmit = (event) => {
    event.preventDefault();
    console.log("Submitting QR payload:", qrForm);
    alert("QR code created successfully.");

    setQrForm((currentForm) => ({
      ...currentForm,
      productName: "",
      qrCodeString: "",
    }));
  };

  const handleExcelSubmit = () => {
    if (!excelFile) {
      alert("Please choose an Excel file.");
      return;
    }

    alert(`Batch upload submitted from file: ${excelFile.name}. The system is processing it.`);
    setExcelFile(null);
  };

  const handleSettingsSubmit = (event) => {
    event.preventDefault();
    alert("Changes saved.");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((currentState) => ({
      ...currentState,
      [field]: !currentState[field],
    }));
  };

  const toggleSystemGenerated = (checked) => {
    setQrForm((currentForm) => ({
      ...currentForm,
      isSystemGenerated: checked,
      qrCodeString: "",
    }));
  };

  return {
    activeTab,
    brandInfo,
    excelFile,
    excelInputRef,
    isDragging,
    logoInputRef,
    passwords,
    qrForm,
    showPasswords,
    handleExcelChange,
    handleExcelDragLeave,
    handleExcelDragOver,
    handleExcelDrop,
    handleExcelSubmit,
    handleLogoChange,
    handleManualQrSubmit,
    handleSettingsSubmit,
    setActiveTab,
    setBrandInfoField,
    setExcelFile,
    setPasswordField,
    setQrFormField,
    togglePasswordVisibility,
    toggleSystemGenerated,
  };
}
