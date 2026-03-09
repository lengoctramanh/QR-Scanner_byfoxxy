import hmac
import hashlib

SECRET_KEY = b"my_secret_key"

def sign_product(product_id: str):

    signature = hmac.new(
        SECRET_KEY,
        product_id.encode(),
        hashlib.sha256
    ).hexdigest()

    return signature