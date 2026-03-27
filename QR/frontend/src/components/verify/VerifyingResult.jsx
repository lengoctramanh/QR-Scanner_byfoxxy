export default function VerifyingResult({ data }) {
  return (
    <div className="result warning">
      <h1>⏳ Sản phẩm đang được xác minh</h1>
      <p>{data.message}</p>

      {data.product && (
        <div className="card">
          <p><strong>Thương hiệu:</strong> {data.product?.brand}</p>
          <p><strong>Tên sản phẩm:</strong> {data.product?.name}</p>
        </div>
      )}
    </div>
  );
}