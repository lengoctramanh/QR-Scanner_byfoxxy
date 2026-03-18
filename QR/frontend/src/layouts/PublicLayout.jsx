import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function PublicLayout({ children }) {
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
