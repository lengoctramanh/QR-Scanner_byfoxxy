// src/utils/dateUtils.js

// Hàm tính thời gian còn lại
export const calculateTimeLeft = (expiryDate) => {
  if (!expiryDate) return "Không thời hạn";
  const difference = new Date(expiryDate) - new Date();
  if (difference <= 0) return "Đã hết hạn";

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);

  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  return `Còn ${hours} giờ ${minutes} phút`;
};

// Hàm format ngày giờ đẹp mắt (Dùng cho mảng scanTimes)
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
