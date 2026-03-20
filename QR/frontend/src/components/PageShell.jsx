import Header from "./Header";

// Ham nay dung de boc mot trang bang layout co Header san co.
// Nhan vao: children la noi dung trang can hien thi ben trong khung.
// Tra ve: JSX layout gom page-container, main-panel va Header.
export default function PageShell({ children }) {
  return (
    <div className="page-container">
      <div className="main-panel">
        <Header />
        {children}
      </div>
    </div>
  );
}
