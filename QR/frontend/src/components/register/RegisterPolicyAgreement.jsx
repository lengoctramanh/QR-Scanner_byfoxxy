import FieldFeedbackMessage from "../common/FieldFeedbackMessage";

// Ham nay dung de render checkbox dong y dieu khoan va chinh sach.
// Nhan vao: checked la trang thai checkbox, onChange la ham xu ly khi tick.
// Tra ve: JSX khu vuc checkbox chinh sach cua form dang ky.
import { Link } from "react-router-dom";
export default function RegisterPolicyAgreement({ checked, onChange }) {
  return (
    <div className="policy-check">
      <label>
        <input
          type="checkbox"
          name="agreePolicy"
          checked={checked}
          onChange={onChange}
        />
        {" "}
        I agree to the{" "}
        <Link to="/terms-of-service">Terms of Service</Link>
        {" "}and{" "}
        <Link to="/privacy-policy">Privacy Policy</Link>.
      </label>
      <FieldFeedbackMessage message={error} />
    </div>
  );
}
