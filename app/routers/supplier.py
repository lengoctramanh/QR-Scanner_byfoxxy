from fastapi import APIRouter
from ..schemas import BatchCreate
from ..qr_service import generate_qr_for_products

router = APIRouter()


@router.get("/test")
def test_supplier():
    return {"message": "supplier router working"}


@router.post("/create-batch")
def create_batch(data: BatchCreate):
    """
    Nhà cung cấp gửi thông tin lô sản phẩm
    Hệ thống tạo QR cho từng sản phẩm
    """

    tokens = generate_qr_for_products(data.quantity)

    return {
        "product_name": data.product_name,
        "product_code": data.product_code,
        "quantity": data.quantity,
        "qr_tokens": tokens
    }