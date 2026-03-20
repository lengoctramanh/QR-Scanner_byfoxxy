import { useEffect, useRef, useState } from "react";
import { fetchCurrentUserProfile } from "../services/authService";
import useAuthCheck from "./useAuthCheck";

const INITIAL_BRAND_INFO = {
  avatar: "",
  fullName: "",
  businessName: "",
  taxId: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  logo: "",
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
const DEFAULT_BRAND_LOGO = "/pictures/logo/logoDefault.png";

// Ham nay dung de quan ly state va hanh vi chinh cua dashboard brand.
// Nhan vao: khong nhan tham so nao.
// Tra ve: state, ref va cac handler de trang BrandDashboard su dung.
export default function useBrandDashboard() {
  useAuthCheck("brand");

  const [activeTab, setActiveTab] = useState("create");
  const [isDragging, setIsDragging] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [brandInfo, setBrandInfo] = useState(INITIAL_BRAND_INFO);
  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [showPasswords, setShowPasswords] = useState(INITIAL_SHOW_PASSWORDS);
  const [qrForm, setQrForm] = useState(INITIAL_QR_FORM);

  const avatarInputRef = useRef(null);
  const excelInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Ham nay dung de nap profile brand that tu backend va map vao state brandInfo cho giao dien.
    // Nhan vao: khong nhan tham so, token duoc gui thong qua axiosClient.
    // Tac dong: goi /auth/me, lay thong tin account + brand va cap nhat brandInfo.
    const loadCurrentBrandProfile = async () => {
      const result = await fetchCurrentUserProfile();

      if (!isMounted) return;

      if (!result.success) {
        console.error("Hook Error (useBrandDashboard profile):", result.message);
        return;
      }

      const profile = result.data || {};
      const brandProfile = profile.brand || {};

      setBrandInfo({
        avatar: profile.avatarUrl || "",
        fullName: profile.fullName || "",
        businessName: brandProfile.brandName || "",
        taxId: brandProfile.taxId || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: "",
        website: brandProfile.website || "",
        logo: brandProfile.logoUrl || DEFAULT_BRAND_LOGO,
      });
    };

    loadCurrentBrandProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ham nay dung de cap nhat tung truong thong tin thuong hieu.
  // Nhan vao: field la ten truong can sua, value la gia tri moi.
  // Tac dong: cap nhat object brandInfo theo truong duoc chon.
  const setBrandInfoField = (field, value) => {
    setBrandInfo((currentInfo) => ({
      ...currentInfo,
      [field]: value,
    }));
  };

  // Ham nay dung de cap nhat du lieu mat khau trong tab settings.
  // Nhan vao: field la ten truong mat khau, value la gia tri moi.
  // Tac dong: cap nhat object passwords.
  const setPasswordField = (field, value) => {
    setPasswords((currentPasswords) => ({
      ...currentPasswords,
      [field]: value,
    }));
  };

  // Ham nay dung de cap nhat tung truong trong form tao QR.
  // Nhan vao: field la ten truong trong qrForm, value la gia tri moi.
  // Tac dong: cap nhat object qrForm.
  const setQrFormField = (field, value) => {
    setQrForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  // Ham nay dung de doi avatar tam thoi khi brand chon anh dai dien moi.
  // Nhan vao: event la su kien onChange cua input avatar.
  // Tac dong: tao object URL tu file va luu vao brandInfo.avatar.
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBrandInfo((currentInfo) => ({
      ...currentInfo,
      avatar: URL.createObjectURL(file),
    }));
  };

  // Ham nay dung de bat hieu ung drag khi file Excel di vao khu vuc upload.
  // Nhan vao: event la su kien drag over.
  // Tac dong: chan hanh vi mac dinh va bat isDragging.
  const handleExcelDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // Ham nay dung de tat hieu ung drag khi file roi khoi khu vuc upload.
  // Nhan vao: khong nhan tham so bat buoc.
  // Tac dong: dat isDragging ve false.
  const handleExcelDragLeave = () => {
    setIsDragging(false);
  };

  // Ham nay dung de xu ly file Excel khi nguoi dung tha vao khu vuc upload.
  // Nhan vao: event la su kien drop chua file da tha vao.
  // Tac dong: kiem tra duoi file hop le va cap nhat excelFile.
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

  // Ham nay dung de xu ly file Excel khi nguoi dung chon tu may tinh.
  // Nhan vao: event la su kien onChange cua input file.
  // Tac dong: cap nhat state excelFile neu co file.
  const handleExcelChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
  };

  // Ham nay dung de xu ly submit form tao QR thu cong.
  // Nhan vao: event la su kien submit cua form tao QR.
  // Tac dong: log payload, thong bao ket qua va reset mot phan qrForm.
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

  // Ham nay dung de xu ly gui file Excel batch len he thong.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: kiem tra file da chon, hien thong bao va reset excelFile.
  const handleExcelSubmit = () => {
    if (!excelFile) {
      alert("Please choose an Excel file.");
      return;
    }

    alert(`Batch upload submitted from file: ${excelFile.name}. The system is processing it.`);
    setExcelFile(null);
  };

  // Ham nay dung de xu ly submit form settings cua brand.
  // Nhan vao: event la su kien submit cua form settings.
  // Tac dong: chan reload trang va hien thong bao luu thay doi.
  const handleSettingsSubmit = (event) => {
    event.preventDefault();
    alert("Changes saved.");
  };

  // Ham nay dung de bat tat viec hien mat khau trong tab settings.
  // Nhan vao: field la ten truong mat khau can doi trang thai hien thi.
  // Tac dong: dao nguoc gia tri true/false trong showPasswords.
  const togglePasswordVisibility = (field) => {
    setShowPasswords((currentState) => ({
      ...currentState,
      [field]: !currentState[field],
    }));
  };

  // Ham nay dung de chuyen doi giua ma QR tu sinh va ma tu nhap tay.
  // Nhan vao: checked la trang thai moi cua checkbox tao ma tu dong.
  // Tac dong: cap nhat qrForm va xoa qrCodeString khi bat che do tu dong.
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
    avatarInputRef,
    passwords,
    qrForm,
    showPasswords,
    handleAvatarChange,
    handleExcelChange,
    handleExcelDragLeave,
    handleExcelDragOver,
    handleExcelDrop,
    handleExcelSubmit,
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
