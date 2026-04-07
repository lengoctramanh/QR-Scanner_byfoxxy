import "./TermOfService.css";
import { Link } from "react-router-dom";
function TermsOfService() {
  return (
    <div className="policy-page">
      <h1>Terms of Service</h1>
      <p>Welcome to our platform. By using this service, you agree to the following terms...</p>

      <h2>1. Account Responsibilities</h2>
      <p>You are responsible for maintaining the security of your account.</p>

      <h2>2. Acceptable Use</h2>
      <p>You agree not to misuse the platform or violate applicable laws.</p>

      <h2>3. Termination</h2>
      <p>We may suspend or terminate accounts that violate these terms.</p>
      <Link to="/register" className="policy-back-btn">
  ← Back to Register
</Link>
    </div>
  );
}

export default TermsOfService;