from sqlalchemy import Column, String, Integer, ForeignKey
from .database import Base

class Batch(Base):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True)
    product_name = Column(String(255))
    product_code = Column(String(255))
    quantity = Column(Integer)

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True)
    batch_id = Column(String(36), ForeignKey("batches.id"))
    signature = Column(String(255))
    scan_count = Column(Integer, default=0)