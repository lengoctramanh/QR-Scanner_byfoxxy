const fs = require("fs/promises");
const path = require("path");

const ATTACHMENT_PUBLIC_PREFIX = "/pictures/brandRegistrationRequests";
const ATTACHMENT_DISK_ROOT = path.join(__dirname, "..", "pictures", "brandRegistrationRequests");
const LEGACY_ATTACHMENT_PREFIX = "pending-upload://";

// Ham nay dung de lam sach ten tep truoc khi luu xuong o dia de tranh ky tu khong hop le.
// Nhan vao: fileName la ten tep goc nguoi dung tai len.
// Tra ve: chuoi ten tep an toan de luu tren he thong tep.
const sanitizeFileName = (fileName) => {
  const normalizedName = String(fileName || "").trim();
  const cleanedName = normalizedName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, "-");

  return cleanedName || "attachment";
};

// Ham nay dung de tao ten tep duy nhat theo request de tranh trung lap khi upload.
// Nhan vao: originalName la ten tep goc, index la vi tri tep trong danh sach upload.
// Tra ve: ten tep moi da duoc san pham hoa va gan them dau thoi gian.
const buildStoredFileName = (originalName, index) => {
  const extension = path.extname(String(originalName || "")).toLowerCase();
  const baseName = path.basename(String(originalName || ""), extension);
  const safeBaseName = sanitizeFileName(baseName);

  return `${Date.now()}-${index + 1}-${safeBaseName}${extension}`;
};

// Ham nay dung de tao public URL cho attachment sau khi da luu thanh cong.
// Nhan vao: requestId la ma request va fileName la ten tep da luu.
// Tra ve: duong dan public frontend co the truy cap de tai tep.
const buildStoredAttachmentPublicUrl = (requestId, fileName) => `${ATTACHMENT_PUBLIC_PREFIX}/${requestId}/${fileName}`;

// Ham nay dung de parse du lieu attachment_urls tu DB ve mang JavaScript an toan.
// Nhan vao: rawAttachmentUrls la JSON string, mang, hoac null.
// Tra ve: mang URL attachment da duoc parse.
const parseAttachmentUrls = (rawAttachmentUrls) => {
  if (!rawAttachmentUrls) {
    return [];
  }

  if (Array.isArray(rawAttachmentUrls)) {
    return rawAttachmentUrls;
  }

  try {
    const parsedValue = JSON.parse(rawAttachmentUrls);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
};

// Ham nay dung de trich xuat ten tep de hien thi tu URL attachment hoac placeholder cu.
// Nhan vao: attachmentUrl la gia tri dang luu trong DB.
// Tra ve: ten tep de hien thi tren giao dien admin.
const deriveAttachmentDisplayName = (attachmentUrl) => {
  const normalizedUrl = String(attachmentUrl || "");

  if (normalizedUrl.startsWith(LEGACY_ATTACHMENT_PREFIX)) {
    const placeholderValue = normalizedUrl.slice(LEGACY_ATTACHMENT_PREFIX.length);
    const matchedParts = placeholderValue.match(/^\d+-\d+-(.+)$/);
    return matchedParts?.[1] || placeholderValue || "Legacy attachment";
  }

  const lastPathSegment = normalizedUrl.split("/").pop();
  const decodedSegment = lastPathSegment ? decodeURIComponent(lastPathSegment) : "";
  const matchedParts = decodedSegment.match(/^\d+-\d+-(.+)$/);
  return matchedParts?.[1] || decodedSegment || "Attachment";
};

// Ham nay dung de chuyen danh sach URL attachment thanh metadata day du cho frontend admin.
// Nhan vao: rawAttachmentUrls la du lieu attachment_urls tu DB.
// Tra ve: mang object metadata gom ten tep, link tai va trang thai kha dung.
const mapAttachmentUrlsToDescriptors = (rawAttachmentUrls) =>
  parseAttachmentUrls(rawAttachmentUrls).map((attachmentUrl, index) => {
    const isLegacyUnavailable = String(attachmentUrl || "").startsWith(LEGACY_ATTACHMENT_PREFIX);

    return {
      id: `attachment-${index + 1}`,
      fileName: deriveAttachmentDisplayName(attachmentUrl),
      downloadUrl: isLegacyUnavailable ? null : attachmentUrl,
      isAvailable: !isLegacyUnavailable,
      sourceUrl: attachmentUrl,
      note: isLegacyUnavailable ? "This file was submitted before attachment storage was enabled and is no longer available for download." : "",
    };
  });

// Ham nay dung de luu tep dinh kem request brand xuong o dia va tao danh sach public URL.
// Nhan vao: requestId la ma request, attachments la mang tep do multer tra ve.
// Tra ve: chuoi JSON chua cac public URL attachment da duoc luu.
const saveRegistrationAttachments = async (requestId, attachments = []) => {
  const requestDirectory = path.join(ATTACHMENT_DISK_ROOT, requestId);

  if (!attachments.length) {
    return JSON.stringify([]);
  }

  await fs.mkdir(requestDirectory, { recursive: true });

  const storedAttachmentUrls = [];

  for (let index = 0; index < attachments.length; index += 1) {
    const currentFile = attachments[index];
    const storedFileName = buildStoredFileName(currentFile.originalname, index);
    const storedFilePath = path.join(requestDirectory, storedFileName);

    await fs.writeFile(storedFilePath, currentFile.buffer);
    storedAttachmentUrls.push(buildStoredAttachmentPublicUrl(requestId, storedFileName));
  }

  return JSON.stringify(storedAttachmentUrls);
};

// Ham nay dung de xoa thu muc attachment cua request neu qua trinh submit bi loi giua chung.
// Nhan vao: requestId la ma request can don dep tep da luu tam.
// Tac dong: xoa de quy thu muc attachment neu ton tai.
const cleanupRegistrationAttachments = async (requestId) => {
  const requestDirectory = path.join(ATTACHMENT_DISK_ROOT, requestId);

  await fs.rm(requestDirectory, {
    recursive: true,
    force: true,
  });
};

module.exports = {
  ATTACHMENT_PUBLIC_PREFIX,
  cleanupRegistrationAttachments,
  mapAttachmentUrlsToDescriptors,
  parseAttachmentUrls,
  saveRegistrationAttachments,
};
