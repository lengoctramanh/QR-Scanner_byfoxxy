import { Routes, Route } from "react-router-dom";
import CodePage from "./pages/Code";
import Home from "./pages/Home";
import AboutPage from "./pages/About";
import SuggestionPane from "./pages/Suggestion";
import RegisterPage from "./pages/Register";
import LoginPage from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import UserDashboard from "./pages/UserDashboard";
import BrandDashboard from "./pages/BrandDashboard";
import SupplierDashboard from "./pages/SupplierDashboard"; // THÊM DÒNG NÀY

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/code" element={<CodePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/suggestion" element={<SuggestionPane />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/profile" element={<UserDashboard />} />
      <Route path="/brand-profile" element={<BrandDashboard />} />
      {/* THÊM DÒNG NÀY CHO SUPPLIER */}
      <Route path="/supplier-profile" element={<SupplierDashboard />} />
    </Routes>
  );
}

export default App;
