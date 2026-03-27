export default function AuthenticResult({ data }) {
  const product = data.product;

  return (
    <div className="result success">
      <h1>✅ Sản phẩm chính hãng</h1>
      <p>{data.message}</p>

      <div className="card">
        <p><strong>Thương hiệu:</strong> {product?.brand}</p>
        <p><strong>Tên sản phẩm:</strong> {product?.name}</p>
        <p><strong>Ngày sản xuất:</strong> {product?.manufactureDate}</p>
        <p><strong>Hạn sử dụng:</strong> {product?.expiryDate}</p>
        <p><strong>Xuất xứ:</strong> {product?.origin}</p>
      </div>
    </div>
  );
}