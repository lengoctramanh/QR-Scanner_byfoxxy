export default function ErrorState({ message }) {
  return (
    <div className="result fake">
      <h2>Lỗi hệ thống</h2>
      <p>{message}</p>
    </div>
  );
}