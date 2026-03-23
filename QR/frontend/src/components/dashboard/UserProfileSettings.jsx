import { CalendarDays, Phone, Save, UserRound } from "lucide-react";
import ProfileMediaDropzone from "./ProfileMediaDropzone";

// Ham nay dung de render form cap nhat thong tin ca nhan cua user, tach rieng khoi card doi mat khau.
// Nhan vao: userInfo, state upload avatar, feedback va cac handler thay doi/submit tu hook.
// Tra ve: JSX profile form de user luu ten, ngay sinh, gioi tinh, so dien thoai va avatar.
export default function UserProfileSettings({
  userInfo,
  avatarInputRef,
  avatarFileName,
  isAvatarDragging,
  isSubmitting,
  feedback,
  onFieldChange,
  onSubmit,
  onAvatarChange,
  onAvatarDrop,
  onAvatarDragLeave,
  onAvatarDragOver,
}) {
  return (
    <form className="profile-card" onSubmit={onSubmit}>
      <div className="profile-card-header">
        <div className="profile-card-icon">
          <UserRound size={18} />
        </div>
        <div>
          <h3>Edit Profile</h3>
          <p>Update your personal details and avatar. Password changes stay separate below.</p>
        </div>
      </div>

      <div className="profile-form-grid">
        <div className="input-group">
          <label htmlFor="user-full-name">Full Name</label>
          <input id="user-full-name" type="text" value={userInfo.fullName} onChange={(event) => onFieldChange("fullName", event.target.value)} className="profile-input" placeholder="Your full name" />
        </div>

        <ProfileMediaDropzone
          title="Avatar"
          description="Drag and drop an image or click to choose."
          previewUrl={userInfo.avatar}
          fileName={avatarFileName}
          isDragging={isAvatarDragging}
          inputRef={avatarInputRef}
          onChange={onAvatarChange}
          onDrop={onAvatarDrop}
          onDragLeave={onAvatarDragLeave}
          onDragOver={onAvatarDragOver}
        />

        <div className="input-group">
          <label htmlFor="user-phone">Phone Number</label>
          <div className="profile-input-shell">
            <Phone size={16} />
            <input id="user-phone" type="text" value={userInfo.phone} onChange={(event) => onFieldChange("phone", event.target.value)} className="profile-input profile-input-plain" placeholder="Add a phone number" />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="user-dob">Date of Birth</label>
          <div className="profile-input-shell">
            <CalendarDays size={16} />
            <input id="user-dob" type="date" value={userInfo.dob} onChange={(event) => onFieldChange("dob", event.target.value)} className="profile-input profile-input-plain" />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="user-gender">Gender</label>
          <select id="user-gender" value={userInfo.gender} onChange={(event) => onFieldChange("gender", event.target.value)} className="profile-input profile-select">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="secret">Prefer not to say</option>
          </select>
        </div>
      </div>

      {feedback.message ? <div className={`profile-feedback ${feedback.type}`}>{feedback.message}</div> : null}

      <div className="profile-card-actions">
        <button type="submit" className="save-btn profile-save-btn" disabled={isSubmitting}>
          <Save size={16} />
          {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </form>
  );
}
