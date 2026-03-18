import { useRef, useState } from "react";
import useAuthCheck from "./useAuthCheck";

const INITIAL_SCAN_HISTORY = [
  {
    id: "scan-3",
    qr_id: "qr-001",
    qrType: "Product",
    productName: "Nike Air Max 97",
    expiryDate: new Date(Date.now() + 86400000 * 3),
    scanTimes: ["2026-03-06 11:00:00", "2026-03-07 09:30:00"],
    qrImage: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
  },
  {
    id: "scan-4",
    qr_id: "qr-002",
    qrType: "Warranty",
    productName: "Dell XPS 15 Laptop",
    expiryDate: new Date(Date.now() - 86400000 * 5),
    scanTimes: ["2026-02-15 14:20:00"],
    qrImage: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
  },
];

const INITIAL_USER_INFO = {
  fullName: "Nguyen Van A",
  email: "nguyenvana@gmail.com",
  phone: "0901234567",
  dob: "2000-01-01",
  gender: "male",
  avatar: "https://i.pravatar.cc/150?img=11",
};

export default function useUserDashboard() {
  useAuthCheck("user");

  const [activeTab, setActiveTab] = useState("history");
  const [selectedScan, setSelectedScan] = useState(null);
  const [userInfo, setUserInfo] = useState(INITIAL_USER_INFO);
  const [scanHistoryData] = useState(INITIAL_SCAN_HISTORY);
  const fileInputRef = useRef(null);

  const activeScans = scanHistoryData.filter((scan) => new Date(scan.expiryDate) > new Date());

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUserInfo((currentInfo) => ({
      ...currentInfo,
      avatar: URL.createObjectURL(file),
    }));
  };

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
