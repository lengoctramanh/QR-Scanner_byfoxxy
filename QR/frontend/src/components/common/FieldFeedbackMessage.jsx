// Ham nay dung de hien thi loi validation ngay ben duoi tung input.
// Nhan vao: message la noi dung loi can render.
// Tra ve: JSX ngan gon hoac null neu khong co loi.
export default function FieldFeedbackMessage({ message = "" }) {
  if (!message) {
    return null;
  }

  return (
    <p className="field-feedback-message" role="alert">
      {message}
    </p>
  );
}
