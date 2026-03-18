export default function RegisterPolicyAgreement({ checked, onChange }) {
  return (
    <div className="policy-check">
      <label>
        <input type="checkbox" name="agreePolicy" checked={checked} onChange={onChange} />I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </label>
    </div>
  );
}
