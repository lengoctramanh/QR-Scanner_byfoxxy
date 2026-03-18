import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function SuggestionIntroCard({ submitted, onReset }) {
  return (
    <div className={`appreciation-card ${submitted ? "success-mode" : ""}`}>
      {!submitted ? (
        <div className="appreciation-content">
          <h3>We value your voice!</h3>
          <p>Your ideas drive our innovation. Every proposal is a step toward a better experience for everyone.</p>
          <div className="appreciation-decor"></div>
        </div>
      ) : (
        <div className="success-message-box">
          <CheckCircle size={60} className="success-icon" />
          <h2>Thank You!</h2>
          <p>We appreciate your feedback! Your proposal has been received and will be carefully reviewed by our team.</p>
          <div className="action-buttons-group">
            <button type="button" className="btn-reset" onClick={onReset}>
              Send another feedback
            </button>
            <Link to="/" className="btn-home">
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
