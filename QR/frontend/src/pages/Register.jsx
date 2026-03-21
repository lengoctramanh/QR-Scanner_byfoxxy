import { Link } from "react-router-dom";
import RegisterAccountSection from "../components/register/RegisterAccountSection";
import RegisterBrandSection from "../components/register/RegisterBrandSection";
import RegisterPolicyAgreement from "../components/register/RegisterPolicyAgreement";
import RegisterRoleSelector from "../components/register/RegisterRoleSelector";
import useRegisterForm from "../hooks/useRegisterForm";
import "./Register.css";

// Ham nay dung de render trang dang ky va ket noi giao dien voi custom hook xu ly form.
// Nhan vao: khong nhan props, su dung du lieu/handler tu useRegisterForm.
// Tra ve: giao dien dang ky cho user hoac brand.
export default function Register() {
  const { role, showPassword, showConfirmPassword, isDragging, formData, fileInputRef, handleChange, handleRoleChange, handleFileChange, handleDragOver, handleDragLeave, handleDrop, handleRemoveFile, handleSubmit, toggleShowPassword, toggleShowConfirmPassword } = useRegisterForm();

  return (
    <main className="register-main">
      <div className="register-card">
        <div className="reg-header">
          <h2>Create an Account</h2>
          <p>Join our platform to start scanning, managing, or distributing QR codes.</p>
        </div>

        <RegisterRoleSelector role={role} onRoleChange={handleRoleChange} />

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <RegisterAccountSection formData={formData} showPassword={showPassword} showConfirmPassword={showConfirmPassword} onChange={handleChange} onTogglePassword={toggleShowPassword} onToggleConfirmPassword={toggleShowConfirmPassword} />

          {role === "brand" ? <RegisterBrandSection formData={formData} fileInputRef={fileInputRef} isDragging={isDragging} onChange={handleChange} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onFileChange={handleFileChange} onRemoveFile={handleRemoveFile} /> : null}

          <RegisterPolicyAgreement checked={formData.agreePolicy} onChange={handleChange} />

          <button type="submit" className="submit-reg-btn">
            CREATE ACCOUNT
          </button>
       
          <div className="login-prompt">
            Already have an account? <Link to="/login">Sign In here</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
