import argparse
import json
from pathlib import Path

import cv2  # type: ignore
import numpy as np


PROCESSOR_DIRECTORY = Path(__file__).resolve().parent
MODELS_DIRECTORY = PROCESSOR_DIRECTORY / "models"
DETECT_PROTO_PATH = MODELS_DIRECTORY / "detect.prototxt"
DETECT_MODEL_PATH = MODELS_DIRECTORY / "detect.caffemodel"
SR_PROTO_PATH = MODELS_DIRECTORY / "sr.prototxt"
SR_MODEL_PATH = MODELS_DIRECTORY / "sr.caffemodel"


# Ham nay dung de ghi ket qua xu ly ra stdout theo JSON de Node worker doc lai.
# Nhan vao: success la ket qua, mode la detector su dung, message la dien giai va extra la metadata bo sung.
# Tac dong: in mot dong JSON ra stdout.
def emit_result(success, mode, message, **extra):
    payload = {
        "success": success,
        "mode": mode,
        "message": message,
    }
    payload.update(extra)
    print(json.dumps(payload))


# Ham nay dung de kiem tra du 4 file model cua WeChat QR detector hay chua.
# Nhan vao: khong nhan tham so nao.
# Tra ve: tuple (du_model_hay_khong, danh_sach_file_thieu).
def get_missing_model_paths():
    required_paths = [
        DETECT_PROTO_PATH,
        DETECT_MODEL_PATH,
        SR_PROTO_PATH,
        SR_MODEL_PATH,
    ]
    return [str(model_path) for model_path in required_paths if not model_path.exists()]


# Ham nay dung de khoi tao WeChat QR detector khi da co du model.
# Nhan vao: khong nhan tham so nao.
# Tra ve: instance detector cua OpenCV.
def create_wechat_detector():
    missing_models = get_missing_model_paths()
    if missing_models:
        raise FileNotFoundError(
            "Missing WeChat QR detector model files: " + ", ".join(missing_models)
        )

    return cv2.wechat_qrcode_WeChatQRCode(
        str(DETECT_PROTO_PATH),
        str(DETECT_MODEL_PATH),
        str(SR_PROTO_PATH),
        str(SR_MODEL_PATH),
    )


# Ham nay dung de chon QR co dien tich lon nhat neu detector tim thay nhieu ma trong anh.
# Nhan vao: points la tap hop 4 goc cua tung QR.
# Tra ve: mang 4 diem float32 cua QR uu tien nhat.
def choose_primary_qr_points(points):
    normalized_points = np.array(points, dtype=np.float32)

    if normalized_points.ndim == 2 and normalized_points.shape == (4, 2):
        return normalized_points

    best_points = None
    best_area = 0.0

    for candidate in normalized_points:
        contour = np.array(candidate, dtype=np.float32)
        area = abs(cv2.contourArea(contour))

        if area > best_area:
            best_area = area
            best_points = contour

    if best_points is None:
        raise RuntimeError("The QR detector returned invalid corner points.")

    return best_points


# Ham nay dung de bien doi phoi canh va cat rieng vung QR thanh mot anh vuong gon.
# Nhan vao: image la anh goc, box_points la 4 goc cua QR va padding la le du phong.
# Tra ve: anh QR da duoc cat chinh phoi canh.
def warp_qr_region(image, box_points, padding=18):
    points = np.array(box_points, dtype=np.float32)

    top_width = np.linalg.norm(points[1] - points[0])
    bottom_width = np.linalg.norm(points[2] - points[3])
    right_height = np.linalg.norm(points[2] - points[1])
    left_height = np.linalg.norm(points[3] - points[0])

    side_length = int(max(top_width, bottom_width, right_height, left_height))
    side_length = max(side_length, 180)

    destination_points = np.array(
        [
            [padding, padding],
            [side_length - 1 - padding, padding],
            [side_length - 1 - padding, side_length - 1 - padding],
            [padding, side_length - 1 - padding],
        ],
        dtype=np.float32,
    )

    transform_matrix = cv2.getPerspectiveTransform(points, destination_points)
    return cv2.warpPerspective(
        image,
        transform_matrix,
        (side_length, side_length),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(255, 255, 255),
    )


# Ham nay dung de lam sach anh QR sau khi cat de output nhin ro hon cho buoc hau xu ly sau nay.
# Nhan vao: qr_region la anh QR da cat phoi canh.
# Tra ve: anh den-trang da duoc sharpen va resize de luu vao ProcessedQRScan.
def enhance_qr_region(qr_region):
    grayscale = cv2.cvtColor(qr_region, cv2.COLOR_BGR2GRAY)
    denoised = cv2.GaussianBlur(grayscale, (3, 3), 0)
    normalized = cv2.normalize(denoised, None, 0, 255, cv2.NORM_MINMAX)
    thresholded = cv2.adaptiveThreshold(
        normalized,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        5,
    )

    target_size = max(thresholded.shape[0], thresholded.shape[1], 512)
    return cv2.resize(
        thresholded,
        (target_size, target_size),
        interpolation=cv2.INTER_NEAREST,
    )


# Ham nay dung de detect QR bang WeChat detector va lay noi dung cung 4 goc.
# Nhan vao: detector la instance WeChatQRCode, image la anh goc.
# Tra ve: tuple (decoded_texts, primary_points).
def detect_with_wechat(detector, image):
    decoded_texts, points = detector.detectAndDecode(image)

    if points is None or len(points) == 0:
        raise RuntimeError("No QR code was detected in the submitted image.")

    primary_points = choose_primary_qr_points(points)
    return decoded_texts, primary_points


# Ham nay dung de fallback sang detector QRCodeDetector thuong khi WeChat detector gap loi bat ngo.
# Nhan vao: image la anh goc.
# Tra ve: tuple (decoded_texts, primary_points).
def detect_with_standard_qr_detector(image):
    qr_detector = cv2.QRCodeDetector()
    decoded_text, points, _ = qr_detector.detectAndDecode(image)

    if points is None or len(points) == 0:
        raise RuntimeError("No QR code was detected in the submitted image.")

    primary_points = choose_primary_qr_points(points)
    decoded_texts = [decoded_text] if decoded_text else []
    return decoded_texts, primary_points


# Ham nay dung de doc anh goc, detect ma QR, cat ra QR-only va luu vao file output.
# Nhan vao: input_path la anh goc va output_path la noi luu anh da xu ly.
# Tra ve: object metadata thong bao detector da dung va noi dung QR neu giai ma duoc.
def process_image(input_path, output_path):
    image = cv2.imread(str(input_path))
    if image is None:
        raise RuntimeError("Unable to read the source image for QR processing.")

    detector_mode = "wechat_qrcode"

    try:
        wechat_detector = create_wechat_detector()
        decoded_texts, primary_points = detect_with_wechat(wechat_detector, image)
    except Exception as error:  # noqa: BLE001
        detector_mode = "qrcode_detector_fallback"
        decoded_texts, primary_points = detect_with_standard_qr_detector(image)
        fallback_message = str(error)
    else:
        fallback_message = None

    qr_region = warp_qr_region(image, primary_points)
    enhanced_qr = enhance_qr_region(qr_region)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    success = cv2.imwrite(str(output_path), enhanced_qr)

    if not success:
        raise RuntimeError("Unable to save the processed QR image into ProcessedQRScan.")

    message = "The QR image was isolated and stored successfully."
    if fallback_message:
        message = (
            "The QR image was isolated with the fallback detector because the WeChat detector was unavailable: "
            + fallback_message
        )

    emit_result(
        True,
        detector_mode,
        message,
        decodedTexts=decoded_texts,
        outputPath=str(output_path),
        outputSize={
            "width": int(enhanced_qr.shape[1]),
            "height": int(enhanced_qr.shape[0]),
        },
    )


# Ham nay dung de phan tich tham so CLI va goi qua trinh xu ly anh.
# Nhan vao: tham so dong lenh --input va --output.
# Tac dong: chay detect/crop va luu anh QR-only vao ProcessedQRScan.
def main():
    parser = argparse.ArgumentParser(
        description="Detect and isolate a QR code into a processed output image."
    )
    parser.add_argument("--input", required=True, help="Absolute path to the source image.")
    parser.add_argument("--output", required=True, help="Absolute path to the processed QR image.")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()

    if not input_path.exists():
        raise FileNotFoundError(f"Source image was not found: {input_path}")

    process_image(input_path, output_path)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001
        emit_result(False, "error", str(error))
        raise
