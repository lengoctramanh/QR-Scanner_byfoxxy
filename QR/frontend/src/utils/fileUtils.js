// Ham nay dung de loc va tao danh sach tep hop le cho form dang ky brand.
// Nhan vao: filesArray la mang file moi, existingAttachments la mang da co san.
// Tra ve: object chua attachments moi va errorMessage neu co file bi bo qua.
export const processFiles = (filesArray, existingAttachments = []) => {
  if (filesArray.length === 0) {
    return {
      attachments: existingAttachments,
      errorMessage: "",
    };
  }

  const validExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"];

  const validFiles = filesArray.filter((file) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return validExtensions.includes(ext);
  });
  const nextAttachments = [...existingAttachments, ...validFiles].slice(0, 10);
  const hasUnsupportedFile = validFiles.length !== filesArray.length;
  const hasExceededFileLimit = existingAttachments.length + validFiles.length > 10;
  let errorMessage = "";

  if (hasUnsupportedFile) {
    errorMessage = "Only PDF, Word, Excel, CSV, PNG and JPG files are supported.";
  } else if (hasExceededFileLimit) {
    errorMessage = "You can upload up to 10 files only.";
  }

  return {
    attachments: nextAttachments,
    errorMessage,
  };
};

// Ham nay dung de xoa mot file khoi danh sach attachments cua form.
// Nhan vao: indexToRemove va mang attachments hien tai.
// Tra ve: mang moi khong con tep da chon xoa.
export const removeFile = (indexToRemove, attachments = []) => attachments.filter((_, index) => index !== indexToRemove);
