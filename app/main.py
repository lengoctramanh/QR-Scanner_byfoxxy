from fastapi import FastAPI

from .database import engine
from .models import Base
from .routers import supplier


# tạo bảng database nếu chưa tồn tại
Base.metadata.create_all(bind=engine)


# khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="QR Authentication System",
    description="API cho hệ thống xác thực sản phẩm bằng QR",
    version="1.0.0"
)


# đăng ký router của nhà cung cấp
app.include_router(
    supplier.router,
    prefix="/supplier",
    tags=["Supplier API"]
)


# route test nhanh
@app.get("/")
def root():
    return {"message": "QR Authentication System is running"}

@app.get("/verify/{token}")
def verify_product(token: str):
    return {
        "status": "success",
        "message": "QR scanned successfully",
        "token": token
    }