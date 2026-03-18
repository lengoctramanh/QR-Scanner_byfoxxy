import { Clock, Package, Search } from "lucide-react";

const calculateTimeLeft = (expiryDate) => {
  if (!expiryDate) return "No expiration";

  const difference = new Date(expiryDate) - new Date();
  if (difference <= 0) return "Expired";

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h ${minutes}m remaining`;
};

export default function ScanCard({ scan, onViewDetails }) {
  const timeLeft = calculateTimeLeft(scan.expiryDate);
  const isExpired = timeLeft === "Expired";

  return (
    <div className="scan-card">
      <div className="scan-header">
        <span className="scan-type">{scan.qrType}</span>
        <img src={scan.qrImage} alt="QR" className="qr-thumb" />
      </div>

      <div className="scan-info">
        <h4>
          <Package size={16} style={{ verticalAlign: "middle", marginRight: "5px" }} />
          {scan.productName}
        </h4>
        <p className={`time-left ${!isExpired ? "active" : ""}`}>
          <Clock size={14} /> {timeLeft}
        </p>
      </div>

      <div className="scan-actions">
        <span className="scan-count" style={{ cursor: "pointer" }} onClick={onViewDetails}>
          <Search size={14} /> Scanned {scan.scanTimes.length} times
        </span>
        <button className="view-btn">View Product</button>
      </div>
    </div>
  );
}
