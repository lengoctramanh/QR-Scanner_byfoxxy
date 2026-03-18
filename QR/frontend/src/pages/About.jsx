import { Handshake, Info, Mail, Shield, Tag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import "./About.css";

export default function About() {
  return (
    <main className="about-main">
      <div className="about-title-wrapper">
        <h2 className="about-title">
          <Info className="title-icon" />
          ABOUT US
        </h2>
      </div>

      <div className="about-card">
        <div className="info-section">
          <h5 className="section-title">
            <Tag size={18} /> Version
          </h5>
          <p className="section-text">1.0.0</p>
        </div>

        <hr />

        <div className="info-section">
          <h5 className="section-title">
            <Users size={18} /> User Policies
          </h5>
          <ul className="policy-list">
            <li>
              <strong>1. Respect:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </li>
            <li>
              <strong>2. Privacy First:</strong> Fusce dapibus, tellus ac cursus commodo, tortor mauris.
            </li>
            <li>
              <strong>3. Data Security:</strong> Vestibulum id ligula porta felis euismod semper.
            </li>
            <li>
              <strong>4. Fair Use:</strong> Nullam quis risus eget urna mollis ornare vel eu leo.
            </li>
            <li>
              <strong>5. Compliance:</strong> Aenean eu leo quam. Pellentesque ornare sem lacinia quam.
            </li>
          </ul>
        </div>

        <hr />

        <div className="info-section">
          <h5 className="section-title">
            <Shield size={18} /> Privacy Policy
          </h5>
          <p className="muted">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Maecenas sed diam eget risus varius blandit sit amet non magna.</p>
        </div>

        <hr />

        <div className="info-section">
          <h5 className="section-title">
            <Handshake size={18} /> Our Commitment
          </h5>
          <p className="muted">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
          <p className="muted">Curabitur blandit tempus porttitor. Aenean lacinia bibendum nulla sed consectetur. Cras mattis consectetur purus sit amet fermentum.</p>
        </div>

        <hr />

        <div className="info-section center">
          <h5 className="section-title help-title">Your feedback helps us improve. If you would like to share your thoughts or suggestions, please click the button below.</h5>
          <Link to="/suggestion" className="support-btn">
            <Mail size={18} /> Suggestion
          </Link>
        </div>
      </div>
    </main>
  );
}
