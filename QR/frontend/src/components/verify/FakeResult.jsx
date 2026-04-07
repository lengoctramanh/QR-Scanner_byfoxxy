export default function FakeResult({ data }) {
  return (
    <div className="result fake">
      <h1>❌ Cảnh báo hàng giả</h1>
      <p>{data.message}</p>

      <p>Vui lòng kiểm tra lại sản phẩm hoặc liên hệ nhà sản xuất.</p>
    </div>
  );
}