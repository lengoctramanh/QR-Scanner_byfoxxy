import uuid
import qrcode
from .crypto import sign_product


def generate_qr_for_products(quantity):

    tokens = []

    for i in range(quantity):

        # tạo id sản phẩm
        product_id = str(uuid.uuid4())

        # ký chữ ký
        signature = sign_product(product_id)

        # tạo token
        token = f"{product_id}.{signature}"
        
        url = f"http://127.0.0.1:8000/verify/{token}"
        # tạo ảnh QR
        img = qrcode.make(url)

        img.save(f"qrs/{product_id}.png")

        tokens.append(token)

    return tokens