import { Outlet } from "react-router-dom";
import Header from "../components/Header";

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
