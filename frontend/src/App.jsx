import { Routes, Route } from "react-router-dom";
import CodePage from "./pages/Code";
import Home from "./pages/Home";
import AboutPage from "./pages/About";
import SuggestionPane from "./pages/Suggestion";
import RegisterPage from "./pages/Register";
import LoginPage from "./pages/Login";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/code" element={<CodePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/suggestion" element={<SuggestionPane />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;