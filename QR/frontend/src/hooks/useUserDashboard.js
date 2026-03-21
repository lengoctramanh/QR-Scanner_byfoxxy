import { useEffect, useRef, useState } from "react";
import { fetchCurrentUserProfile } from "../services/authService";
import useAuthCheck from "./useAuthCheck";

const INITIAL_SCAN_HISTORY = [
  {
    id: "",
    qr_id: "",
    qrType: "",
    productName: "",
    expiryDate: new Date(Date.now() + 86400000 * 3),
    scanTimes: [],
    qrImage: "",
  },
];

const INITIAL_USER_INFO = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  avatar: "",
};

// Ham nay dung de quan ly du lieu va thao tac cua trang dashboard user.
// Nhan vao: khong nhan tham so nao.
// Tra ve: state dashboard, thong tin user va cac handler de component giao dien su dung.
export default function useUserDashboard() {
  useAuthCheck("user");

  const [activeTab, setActiveTab] = useState("history");
  const [selectedScan, setSelectedScan] = useState(null);
  const [userInfo, setUserInfo] = useState(INITIAL_USER_INFO);
  const [scanHistoryData] = useState(INITIAL_SCAN_HISTORY);
  const fileInputRef = useRef(null);

  // Ham nay dung de tai profile that tu backend ngay khi dashboard user duoc mo.
  // Nhan vao: khong nhan tham so, su dung token da luu trong authStorage thong qua axiosClient.
  // Tac dong: goi /auth/me va cap nhat userInfo tu du lieu DB neu request thanh cong.
  useEffect(() => {
    let isMounted = true;

    // Ham nay dung de dong goi logic goi API lay current profile va map du lieu vao UI.
    // Nhan vao: khong nhan tham so.
    // Tac dong: goi service lay profile, log loi neu that bai va setUserInfo neu thanh cong.
    const loadCurrentProfile = async () => {
      const result = await fetchCurrentUserProfile();

      if (!isMounted) return;

      if (!result.success) {
        console.error("Hook Error (useUserDashboard profile):", result.message);
        return;
      }

      const profile = result.data || {};

      setUserInfo({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        avatar: profile.avatarUrl || "",
      });
    };

    loadCurrentProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeScans = scanHistoryData.filter((scan) => new Date(scan.expiryDate) > new Date());

  // Ham nay dung de cap nhat avatar tam thoi khi user chon anh moi tu may.
  // Nhan vao: event la su kien onChange cua input file avatar.
  // Tac dong: tao object URL tu file va cap nhat vao userInfo.avatar.
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUserInfo((currentInfo) => ({
      ...currentInfo,
      avatar: URL.createObjectURL(file),
      }));
  };

  // Ham nay dung de xu ly luu thay doi thong tin user trong phan settings.
  // Nhan vao: event la su kien submit cua form settings.
  // Tac dong: chan reload trang va hien thong bao luu thanh cong.
  const handleSaveSettings = (event) => {
    event.preventDefault();
    alert("Profile changes saved.");
  };

  return {
    activeScans,
    activeTab,
    fileInputRef,
    scanHistoryData,
    selectedScan,
    userInfo,
    closeScanDetails: () => setSelectedScan(null),
    handleAvatarChange,
    handleSaveSettings,
    openScanDetails: setSelectedScan,
    setActiveTab,
  };
}
