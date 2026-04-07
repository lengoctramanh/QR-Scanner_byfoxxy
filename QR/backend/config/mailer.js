const nodemailer = require("nodemailer");
require("dotenv").config();

let transporterInstance = null;

// Ham nay dung de khoi tao transporter Nodemailer cho Gmail SMTP mot lan duy nhat.
// Nhan vao: khong nhan tham so, doc EMAIL_USER va EMAIL_PASS tu bien moi truong.
// Tra ve: transporter da san sang gui email, hoac nem loi neu cau hinh thieu.
const getMailerTransporter = () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured before sending mail.");
  }

  transporterInstance = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporterInstance;
};

// Ham nay dung de xac dinh dia chi nguoi gui hien thi trong email.
// Nhan vao: khong nhan tham so, uu tien EMAIL_FROM neu duoc cau hinh.
// Tra ve: chuoi dia chi from hop le de sendMail su dung.
const getMailerFromAddress = () => process.env.EMAIL_FROM || process.env.EMAIL_USER;

module.exports = {
  getMailerTransporter,
  getMailerFromAddress,
};
