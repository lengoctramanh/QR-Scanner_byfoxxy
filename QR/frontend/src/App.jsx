import { Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";
import AdminDashboard from "./pages/AdminDashboard";
import BrandDashboard from "./pages/BrandDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import TermOfService from "./pages/TermOfService";
import PolicyPage from "./pages/PolicyPage"
import VerifyPage from "./pages/VerifyPage";
// Ham nay dung de khai bao toan bo router goc cua frontend.
// Nhan vao: khong nhan tham so truc tiep, su dung route hien tai tu react-router-dom.
// Tra ve: cay JSX chua cac route cong khai va dashboard.
function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/terms-of-service" element={<TermOfService />} />
        <Route path="/privacy-policy" element={<PolicyPage/>}/>
        <Route path="*" element={<NotFound />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/profile" element={<UserDashboard />} />
        <Route path="/brand-profile" element={<BrandDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Route>
    </Routes>
  );
}

export default App;
