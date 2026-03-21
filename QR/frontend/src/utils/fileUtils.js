// Ham nay dung de loc va them danh sach file hop le vao form dang ky.
// Nhan vao: filesArray la mang file nguoi dung chon, setFormData la ham cap nhat state, fileInputRef la ref cua o input file.
// Tac dong: cap nhat truong attachments trong form va reset gia tri input file.
export const processFiles = (filesArray, setFormData, fileInputRef) => {
  if (filesArray.length === 0) return;

  const validExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];

  const validFiles = filesArray.filter((file) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return validExtensions.includes(ext);
  });

  if (validFiles.length !== filesArray.length) {
    alert("Some files were skipped because their format is not supported.");
  }

  if (validFiles.length > 0) {
    setFormData((prev) => {
      const newAttachments = [...prev.attachments, ...validFiles];

      if (newAttachments.length > 10) {
        alert("You can upload up to 10 files only.");
        return { ...prev, attachments: newAttachments.slice(0, 10) };
      }

      return { ...prev, attachments: newAttachments };
    });
  }

  if (fileInputRef?.current) {
    fileInputRef.current.value = "";
  }
};

// Ham nay dung de xoa mot file khoi danh sach attachments cua form.
// Nhan vao: indexToRemove la vi tri file can xoa, setFormData la ham cap nhat state.
// Tac dong: tao lai mang attachments moi khong con file duoc chon.
export const removeFile = (indexToRemove, setFormData) => {
  setFormData((prev) => ({
    ...prev,
    attachments: prev.attachments.filter((_, index) => index !== indexToRemove),
  }));
};
