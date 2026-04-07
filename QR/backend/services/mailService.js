const { getMailerTransporter, getMailerFromAddress } = require("../config/mailer");

// Ham nay dung de tao noi dung HTML cho email OTP dat lai mat khau.
// Nhan vao: thong tin nguoi nhan, ma OTP va thoi gian het han.
// Tra ve: chuoi HTML gon, de doc va de tai su dung cho cac email auth sau nay.
const buildPasswordResetOtpHtml = ({ fullName, otpCode, expiresInMinutes }) => `
  <div style="font-family: Arial, sans-serif; background: #f4f8ff; padding: 24px;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #dbe8ff;">
      <h2 style="margin: 0 0 16px; color: #16345f;">Reset Your Password</h2>
      <p style="margin: 0 0 12px; color: #42526b; line-height: 1.6;">
        Hello ${fullName || "there"},
      </p>
      <p style="margin: 0 0 18px; color: #42526b; line-height: 1.6;">
        Use the verification code below to continue resetting your password.
        This code will expire in ${expiresInMinutes} minutes.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <span style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 16px 24px;">
          ${otpCode}
        </span>
      </div>
      <p style="margin: 0; color: #64748b; line-height: 1.6; font-size: 14px;">
        If you did not request this change, you can safely ignore this email.
      </p>
    </div>
  </div>
`;

// Ham nay dung de gui email OTP quen mat khau thong qua mailer chung.
// Nhan vao: recipientEmail, fullName, otpCode va expiresInMinutes.
// Tac dong: gui email den dia chi da chi dinh bang Nodemailer.
const sendPasswordResetOtpEmail = async ({ recipientEmail, fullName, otpCode, expiresInMinutes }) => {
  const transporter = getMailerTransporter();
  const fromAddress = getMailerFromAddress();

  await transporter.sendMail({
    from: fromAddress,
    to: recipientEmail,
    subject: "Your Password Reset OTP",
    text: `Hello ${fullName || "there"}, your password reset OTP is ${otpCode}. It expires in ${expiresInMinutes} minutes.`,
    html: buildPasswordResetOtpHtml({
      fullName,
      otpCode,
      expiresInMinutes,
    }),
  });
};

module.exports = {
  sendPasswordResetOtpEmail,
};
