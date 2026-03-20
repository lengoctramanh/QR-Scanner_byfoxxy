// Ham nay dung de tinh khoang thoi gian con lai cua mot ma QR theo ngay gio phut.
// Nhan vao: expiryDate la moc thoi gian het han cua ma.
// Tra ve: chuoi mo ta thoi gian con lai hoac trang thai het han.
export const calculateTimeLeft = (expiryDate) => {
  if (!expiryDate) return "Khong thoi han";
  const difference = new Date(expiryDate) - new Date();
  if (difference <= 0) return "Da het han";

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);

  if (days > 0) return `Con ${days} ngay ${hours} gio`;
  return `Con ${hours} gio ${minutes} phut`;
};

// Ham nay dung de format moc thoi gian quet ma sang chuoi de doc tren giao dien.
// Nhan vao: dateString la chuoi ngay gio can hien thi.
// Tra ve: chuoi ngay gio da format theo kieu vi-VN.
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
