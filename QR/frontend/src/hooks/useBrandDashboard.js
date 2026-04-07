import { useEffect, useRef, useState } from "react";
import { fetchCurrentUserProfile } from "../services/authService";
import {
  createBrandProduct,
  downloadBrandBatchTemplate,
  exportBrandBatchZip,
  fetchBrandProducts,
  uploadBrandBatchFile,
} from "../services/brandProductService";
import { updateCurrentProfile } from "../services/userService";
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

const INITIAL_PROFILE_FEEDBACK = {
  type: "",
  message: "",
};

const INITIAL_PRODUCT_FEEDBACK = {
  type: "",
  message: "",
};

const INITIAL_QR_FORM = {
  productName: "",
  manufacturerName: "",
  originCountry: "",
  manufactureDate: "",
  expiryDate: "",
  qualityCertifications: "",
  description: "",
  generalInfoUrl: "",
  scanLimit: 5,
  issueQuantity: 10,
};

const EXCEL_FILE_EXTENSIONS = [".xls", ".xlsx", ".csv"];
const DEFAULT_BRAND_LOGO = "/pictures/logo/logo1.png";

// Ham nay dung de kich hoat trinh duyet tai mot blob duoc backend tra ve.
// Nhan vao: blob la du lieu file va fileName la ten file muon hien trong hop tai xuong.
// Tac dong: tao object URL tam thoi, click download roi giai phong bo nho.
const triggerBlobDownload = (blob, fileName) => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

// Ham nay dung de chi giu lai avatar/logo hop le, con null/chuoi rong/gia tri gia se tra ve fallback.
// Nhan vao: mediaUrl la gia tri backend tra ve va fallback la URL mac dinh tuy tung loai.
// Tra ve: URL co the render tren giao dien ngay, hoac fallback neu du lieu khong hop le.
const normalizeMediaUrl = (mediaUrl, fallback = "") => {
  const normalizedValue = typeof mediaUrl === "string" ? mediaUrl.trim() : "";

  if (!normalizedValue || normalizedValue === "null" || normalizedValue === "undefined") {
    return fallback;
  }

  return normalizedValue;
};

// Ham nay dung de map profile backend ve state brandInfo ma dashboard brand dang su dung.
// Nhan vao: profile la object tu endpoint /auth/me da gom account va brand.
// Tra ve: object brandInfo da duoc chuan hoa cho sidebar va form settings.
const mapProfileToBrandInfo = (profile = {}) => {
  const brandProfile = profile.brand || {};

  return {
    avatar: normalizeMediaUrl(profile.avatarUrl, ""),
    fullName: profile.fullName || "",
    businessName: brandProfile.brandName || "",
    taxId: brandProfile.taxId || "",
    email: profile.email || "",
    phone: profile.phone || "",
    address: brandProfile.address || "",
    website: brandProfile.website || "",
    logo: normalizeMediaUrl(brandProfile.logoUrl, DEFAULT_BRAND_LOGO),
  };
};

// Ham nay dung de kiem tra tep nguoi dung vua chon co phai anh hop le hay khong.
// Nhan vao: file la doi tuong File tu input hoac drag-drop.
// Tra ve: true neu la anh, nguoc lai la false.
const isImageFile = (file) => Boolean(file) && String(file.type || "").toLowerCase().startsWith("image/");

// Ham nay dung de quan ly state va hanh vi chinh cua dashboard brand.
// Nhan vao: khong nhan tham so nao.
// Tra ve: state, ref va cac handler de trang BrandDashboard su dung.
export default function useBrandDashboard() {
  useAuthCheck("brand");

  const [activeTab, setActiveTab] = useState("create");
  const [isDragging, setIsDragging] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [brandInfo, setBrandInfo] = useState(INITIAL_BRAND_INFO);
  const [profileFeedback, setProfileFeedback] = useState(INITIAL_PROFILE_FEEDBACK);
  const [productFeedback, setProductFeedback] = useState(INITIAL_PRODUCT_FEEDBACK);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isProductSaving, setIsProductSaving] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [isTemplateDownloading, setIsTemplateDownloading] = useState(false);
  const [activeExportBatchId, setActiveExportBatchId] = useState("");
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [qrForm, setQrForm] = useState(INITIAL_QR_FORM);
  const [brandProducts, setBrandProducts] = useState([]);
  const [latestIssuedQrAssets, setLatestIssuedQrAssets] = useState(null);

  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const excelInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardState = async () => {
      const [profileResult, productsResult] = await Promise.all([
        fetchCurrentUserProfile(),
        fetchBrandProducts(),
      ]);

      if (!isMounted) return;

      if (profileResult.success) {
        setBrandInfo(mapProfileToBrandInfo(profileResult.data || {}));
      } else {
        console.error("Hook Error (useBrandDashboard profile):", profileResult.message);
      }

      if (productsResult.success) {
        setBrandProducts(Array.isArray(productsResult.data) ? productsResult.data : []);
      } else {
        console.error("Hook Error (useBrandDashboard products):", productsResult.message);
      }
    };

    loadDashboardState();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ham nay dung de cap nhat tung truong thong tin thuong hieu.
  // Nhan vao: field la ten truong can sua, value la gia tri moi.
  // Tac dong: cap nhat object brandInfo theo truong duoc chon va xoa feedback cu neu dang hien.
  const setBrandInfoField = (field, value) => {
    setBrandInfo((currentInfo) => ({
      ...currentInfo,
      [field]: value,
    }));

    if (profileFeedback.message) {
      setProfileFeedback(INITIAL_PROFILE_FEEDBACK);
    }
  };

  // Ham nay dung de cap nhat tung truong trong form tao san pham va QR.
  // Nhan vao: field la ten truong trong qrForm, value la gia tri moi.
  // Tac dong: cap nhat object qrForm va clear feedback neu can.
  const setQrFormField = (field, value) => {
    setQrForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (productFeedback.message) {
      setProductFeedback(INITIAL_PRODUCT_FEEDBACK);
    }
  };

  // Ham nay dung de xu ly tep media avatar/logo va cap nhat preview tam thoi truoc khi save.
  // Nhan vao: file la tep nguoi dung vua chon, mediaType cho biet dang cap nhat avatar hay logo.
  // Tac dong: luu File vao state va doi preview tren giao dien.
  const applyMediaFile = (file, mediaType) => {
    if (!isImageFile(file)) {
      setProfileFeedback({
        type: "error",
        message: "Please upload a valid image file.",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (mediaType === "logo") {
      setSelectedLogoFile(file);
      setLogoFileName(file.name);
      setBrandInfo((currentInfo) => ({
        ...currentInfo,
        logo: previewUrl,
      }));
    } else {
      setSelectedAvatarFile(file);
      setAvatarFileName(file.name);
      setBrandInfo((currentInfo) => ({
        ...currentInfo,
        avatar: previewUrl,
      }));
    }

    setProfileFeedback(INITIAL_PROFILE_FEEDBACK);
  };

  // Ham nay dung de doi avatar tam thoi khi brand chon anh dai dien moi.
  // Nhan vao: event la su kien onChange cua input avatar.
  // Tac dong: trich file dau tien va gui qua helper applyMediaFile.
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    applyMediaFile(file, "avatar");
    event.target.value = "";
  };

  // Ham nay dung de doi logo thuong hieu tam thoi khi brand chon anh moi.
  // Nhan vao: event la su kien onChange cua input logo.
  // Tac dong: trich file dau tien va gui qua helper applyMediaFile.
  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    applyMediaFile(file, "logo");
    event.target.value = "";
  };

  // Ham nay dung de bat hieu ung drag cho khu vuc media tuong ung.
  // Nhan vao: mediaType la avatar hoac logo, event la su kien drag over.
  // Tac dong: chan mac dinh va bat co dragging cho dung dropzone.
  const handleMediaDragOver = (mediaType, event) => {
    event.preventDefault();

    if (mediaType === "logo") {
      setIsLogoDragging(true);
      return;
    }

    setIsAvatarDragging(true);
  };

  // Ham nay dung de tat hieu ung drag cho dropzone media khi con tro roi khoi.
  // Nhan vao: mediaType la avatar hoac logo, event la su kien drag leave.
  // Tac dong: tat co dragging cua dropzone tuong ung.
  const handleMediaDragLeave = (mediaType, event) => {
    event.preventDefault();

    if (mediaType === "logo") {
      setIsLogoDragging(false);
      return;
    }

    setIsAvatarDragging(false);
  };

  // Ham nay dung de nhan tep media khi nguoi dung tha vao dropzone avatar/logo.
  // Nhan vao: mediaType la avatar hoac logo, event la su kien drop.
  // Tac dong: tat dragging va dua tep dau tien vao helper applyMediaFile.
  const handleMediaDrop = (mediaType, event) => {
    event.preventDefault();

    if (mediaType === "logo") {
      setIsLogoDragging(false);
    } else {
      setIsAvatarDragging(false);
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    applyMediaFile(file, mediaType);
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
      setProductFeedback(INITIAL_PRODUCT_FEEDBACK);
      return;
    }

    setProductFeedback({
      type: "error",
      message: "Please upload a valid Excel file (.xls, .xlsx, .csv).",
    });
  };

  // Ham nay dung de bat hieu ung drag khi file Excel di vao khu vuc upload.
  // Nhan vao: event la su kien drag over.
  // Tac dong: chan hanh vi mac dinh va bat isDragging.
  const handleExcelDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // Ham nay dung de tat hieu ung drag khi file Excel roi khoi khu vuc upload.
  // Nhan vao: khong nhan tham so bat buoc.
  // Tac dong: dat isDragging ve false.
  const handleExcelDragLeave = () => {
    setIsDragging(false);
  };

  // Ham nay dung de xu ly file Excel khi nguoi dung chon tu may tinh.
  // Nhan vao: event la su kien onChange cua input file.
  // Tac dong: cap nhat state excelFile neu co file.
  const handleExcelChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setProductFeedback(INITIAL_PRODUCT_FEEDBACK);
  };

  // Ham nay dung de tao san pham moi, sinh QR info/auth va cap nhat danh sach san pham tren UI.
  // Nhan vao: event la su kien submit cua form tao QR.
  // Tac dong: goi API tao product, luu QR asset moi nhat va reset form neu thanh cong.
  const handleManualQrSubmit = async (event) => {
    event.preventDefault();
    setIsProductSaving(true);

    const result = await createBrandProduct(qrForm);

    if (!result.success) {
      setProductFeedback({
        type: "error",
        message: result.message,
      });
      setIsProductSaving(false);
      return;
    }

    setBrandProducts(Array.isArray(result.data?.products) ? result.data.products : []);
    setLatestIssuedQrAssets({
      product: result.data?.product || null,
      qrAssets: result.data?.qrAssets || null,
    });
    setProductFeedback({
      type: "success",
      message: result.message,
    });
    setQrForm(INITIAL_QR_FORM);
    setIsProductSaving(false);
    setActiveTab("manage");
  };

  // Ham nay dung de xu ly gui file Excel batch len he thong.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: kiem tra file da chon, hien thong bao va reset excelFile.
  const handleExcelSubmit = async () => {
    if (!excelFile) {
      setProductFeedback({
        type: "error",
        message: "Please choose an Excel file first.",
      });
      return;
    }

    setIsBatchUploading(true);

    const result = await uploadBrandBatchFile(excelFile);

    if (!result.success) {
      setProductFeedback({
        type: "error",
        message: result.message,
      });
      setIsBatchUploading(false);
      return;
    }

    setBrandProducts(Array.isArray(result.data) ? result.data : []);
    setProductFeedback({
      type: "success",
      message: result.message,
    });
    setExcelFile(null);
    setIsBatchUploading(false);
    setActiveTab("manage");
  };

  // Ham nay dung de tai file template Excel mau phuc vu upload batch.
  // Nhan vao: khong nhan tham so nao.
  // Tac dong: goi API lay blob va kich hoat download tren trinh duyet.
  const handleTemplateDownload = async () => {
    setIsTemplateDownloading(true);

    const result = await downloadBrandBatchTemplate();

    if (!result.success) {
      setProductFeedback({
        type: "error",
        message: result.message,
      });
      setIsTemplateDownloading(false);
      return;
    }

    triggerBlobDownload(result.data, result.fileName || "brand-batch-template.xlsx");
    setProductFeedback({
      type: "success",
      message: "The Excel template was downloaded successfully.",
    });
    setIsTemplateDownloading(false);
  };

  // Ham nay dung de tai goi ZIP label frame cua batch tu catalog brand.
  // Nhan vao: batchId la ma batch can export.
  // Tac dong: goi API lay blob zip va tai xuong tren trinh duyet.
  const handleBatchExport = async (batchId) => {
    if (!batchId) {
      return;
    }

    setActiveExportBatchId(batchId);
    const result = await exportBrandBatchZip(batchId);

    if (!result.success) {
      setProductFeedback({
        type: "error",
        message: result.message,
      });
      setActiveExportBatchId("");
      return;
    }

    triggerBlobDownload(result.data, result.fileName || `${batchId}.zip`);
    setProductFeedback({
      type: "success",
      message: "The batch ZIP package was exported successfully.",
    });
    setActiveExportBatchId("");
  };

  // Ham nay dung de luu business profile va media moi cua brand len backend.
  // Nhan vao: event la su kien submit cua form settings.
  // Tac dong: build FormData, goi /api/profile va dong bo lai UI theo ket qua moi nhat.
  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    setIsProfileSaving(true);

    const payload = new FormData();
    payload.append("businessName", brandInfo.businessName);
    payload.append("email", brandInfo.email);
    payload.append("phone", brandInfo.phone);
    payload.append("address", brandInfo.address);
    payload.append("website", brandInfo.website);
    payload.append("taxId", brandInfo.taxId);

    if (selectedAvatarFile) {
      payload.append("avatar", selectedAvatarFile);
    }

    if (selectedLogoFile) {
      payload.append("logo", selectedLogoFile);
    }

    const result = await updateCurrentProfile(payload);

    if (!result.success) {
      setProfileFeedback({
        type: "error",
        message: result.message,
      });
      setIsProfileSaving(false);
      return;
    }

    setBrandInfo(mapProfileToBrandInfo(result.data || {}));
    setSelectedAvatarFile(null);
    setSelectedLogoFile(null);
    setAvatarFileName("");
    setLogoFileName("");
    setProfileFeedback({
      type: "success",
      message: result.message,
    });
    setIsProfileSaving(false);
  };

  return {
    activeTab,
    avatarFileName,
    avatarInputRef,
    brandInfo,
    brandProducts,
    excelFile,
    excelInputRef,
    handleAvatarChange,
    handleAvatarDragLeave: (event) => handleMediaDragLeave("avatar", event),
    handleAvatarDragOver: (event) => handleMediaDragOver("avatar", event),
    handleAvatarDrop: (event) => handleMediaDrop("avatar", event),
    handleBatchExport,
    handleExcelChange,
    handleExcelDragLeave,
    handleExcelDragOver,
    handleExcelDrop,
    handleExcelSubmit,
    handleLogoChange,
    handleLogoDragLeave: (event) => handleMediaDragLeave("logo", event),
    handleLogoDragOver: (event) => handleMediaDragOver("logo", event),
    handleLogoDrop: (event) => handleMediaDrop("logo", event),
    handleManualQrSubmit,
    handleSettingsSubmit,
    handleTemplateDownload,
    isBatchUploading,
    isAvatarDragging,
    isDragging,
    isLogoDragging,
    isProductSaving,
    isProfileSaving,
    isTemplateDownloading,
    latestIssuedQrAssets,
    logoFileName,
    logoInputRef,
    productFeedback,
    profileFeedback,
    qrForm,
    activeExportBatchId,
    setActiveTab,
    setBrandInfoField,
    setExcelFile,
    setQrFormField,
  };
}
