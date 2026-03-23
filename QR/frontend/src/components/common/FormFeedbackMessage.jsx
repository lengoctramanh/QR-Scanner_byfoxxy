// Ham nay dung de hien thi thong diep tong quat cho form theo 3 trang thai info/error/success.
// Nhan vao: tone va message.
// Tra ve: JSX thong bao ngan gon de render tren dau form.
export default function FormFeedbackMessage({ tone = "info", message = "" }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`form-feedback-message ${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
