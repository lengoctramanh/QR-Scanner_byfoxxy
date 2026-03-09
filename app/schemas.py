from pydantic import BaseModel

class BatchCreate(BaseModel):
    product_name: str
    product_code: str
    quantity: int