// Ham nay dung de dinh dang ngay gio cho dashboard admin de hien thi de doc hon.
// Nhan vao: value la gia tri ngay gio can format.
// Tra ve: chuoi ngay gio da format hoac "--" neu khong co du lieu.
export const formatDateTime = (value) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

// Ham nay dung de chi hien phan ngay cua mot gia tri date-time cho giao dien admin.
// Nhan vao: value la gia tri ngay gio can rut gon.
// Tra ve: chuoi ngay da format hoac "--" neu khong co du lieu.
export const formatDateOnly = (value) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

// Ham nay dung de doi trang thai dang UPPER_CASE_THANH_CHU de de hien thi.
// Nhan vao: value la chuoi trang thai goc.
// Tra ve: chuoi trang thai da thay dau "_" bang khoang trang.
export const formatStatusLabel = (value) => value.replaceAll("_", " ");

// Ham nay dung de an bot mot phan token khi hien thi tren giao dien admin.
// Nhan vao: token la chuoi token can che bot.
// Tra ve: chuoi token da rut gon hoac "--" neu khong co token.
export const maskToken = (token) => (!token ? "--" : token.length <= 16 ? token : `${token.slice(0, 8)}...${token.slice(-6)}`);

// Ham nay dung de mo ta thoi gian con lai cua session theo don vi phu hop.
// Nhan vao: minutes la so phut con lai truoc khi session het han.
// Tra ve: chuoi mo ta bang minutes, hours hoac days.
export const describeMinutesRemaining = (minutes) => {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)} days`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)} hours`;
  return `${minutes} minutes`;
};

// Ham nay dung de doi ma gioi tinh thanh nhan de doc tren giao dien.
// Nhan vao: value la ma gioi tinh dang luu trong DB.
// Tra ve: chuoi gioi tinh da duoc viet hoa phu hop de hien thi.
export const formatGenderLabel = (value) => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (!normalizedValue) {
    return "Not updated";
  }

  switch (normalizedValue) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "secret":
      return "Secret";
    default:
      return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
  }
};
