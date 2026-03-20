import jsQR from "jsqr";

// Ham nay dung de doc ma QR tu anh nguoi dung tai len.
// Nhan vao: file la doi tuong anh do nguoi dung chon.
// Tra ve: Promise resolve ra chuoi du lieu QR hoac reject neu khong doc duoc.
export const processQrFromImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        const padding = 40;
        const width = img.width;
        const height = img.height;

        canvas.width = width + padding * 2;
        canvas.height = height + padding * 2;

        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = false;
        context.drawImage(img, padding, padding, width, height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          resolve(code.data);
        } else {
          reject("No QR code found in this image.");
        }
      };

      img.onerror = () => reject("Failed to load image.");
      img.src = event.target.result;
    };

    reader.onerror = () => reject("Failed to read file.");
    reader.readAsDataURL(file);
  });
};
