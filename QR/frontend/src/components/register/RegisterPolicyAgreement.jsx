// Ham nay dung de render checkbox dong y dieu khoan va chinh sach.
// Nhan vao: checked la trang thai checkbox, onChange la ham xu ly khi tick.
// Tra ve: JSX khu vuc checkbox chinh sach cua form dang ky.
export default function RegisterPolicyAgreement({ checked, onChange }) {
  return (
    <div className="policy-check">
      <label>
        <input type="checkbox" name="agreePolicy" checked={checked} onChange={onChange} />I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </label>
    </div>
  );
}
