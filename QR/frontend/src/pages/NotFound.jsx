import "./NotFound.css";
import { Link } from "react-router-dom";

function NotFound() {
  return (
     <div className="notfound-container">
      <div className="notfound-box">
        <h1 className="notfound-title">404</h1>
        <p className="notfound-text">Oops! Page not found</p>
        <Link to="/" className="notfound-btn">
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;