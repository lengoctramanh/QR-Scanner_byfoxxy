import { Link } from "react-router-dom";
function PolicyPage() {
  return (
    <div className="policy-page">
      <h1>Privacy Policy</h1>
      <p>
        We value your privacy and are committed to protecting your personal
        information. This Privacy Policy explains how we collect, use, and
        safeguard your data when you use our platform.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We may collect personal information such as your name, email address,
        phone number, and account details when you register or use our services.
      </p>

      <h2>2. How We Use Your Information</h2>
      <p>
        Your information is used to:
        <ul>
          <li>Provide and maintain our services</li>
          <li>Improve user experience</li>
          <li>Communicate with you</li>
          <li>Ensure security and prevent fraud</li>
        </ul>
      </p>

      <h2>3. Data Protection</h2>
      <p>
        We implement appropriate technical and organizational measures to
        protect your personal data from unauthorized access, loss, or misuse.
      </p>

      <h2>4. Sharing of Information</h2>
      <p>
        We do not sell your personal information. We may share data with trusted
        third parties only when necessary to provide our services or comply with
        legal obligations.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We may use cookies and similar technologies to enhance your experience
        and analyze usage patterns.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        You have the right to access, update, or delete your personal data. You
        can contact us if you have any privacy-related concerns.
      </p>

      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        posted on this page.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at: support@example.com
      </p>
        <Link to="/register" className="policy-back-btn">
  ← Back to Register
</Link>
    </div>
  );
}

export default PolicyPage;