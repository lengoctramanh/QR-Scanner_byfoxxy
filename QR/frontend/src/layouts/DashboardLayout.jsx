import { Outlet } from "react-router-dom";
import Header from "../components/Header";

// Ham nay dung de render layout chung cho cac trang dashboard sau khi dang nhap.
// Nhan vao: children la noi dung truyen truc tiep, neu khong co se dung Outlet.
// Tra ve: JSX layout dashboard co Header va vung content.
export default function DashboardLayout({ children }) {
  const content = children ?? <Outlet />;

  return (
    <div className="page-container">
      <div className="main-panel">
        <Header />
        {content}
      </div>
    </div>
  );
}
