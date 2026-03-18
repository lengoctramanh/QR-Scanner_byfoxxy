import { Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AboutPage from "./pages/About";
import BrandDashboard from "./pages/BrandDashboard";
import CodePage from "./pages/Code";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import SuggestionPane from "./pages/Suggestion";
import UserDashboard from "./pages/UserDashboard";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/code" element={<CodePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/suggestion" element={<SuggestionPane />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/profile" element={<UserDashboard />} />
        <Route path="/brand-profile" element={<BrandDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
