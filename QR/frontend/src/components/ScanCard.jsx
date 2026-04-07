import { CalendarDays, Clock, Package, Search, ShieldCheck, Trash2 } from "lucide-react";

// Ham nay dung de tinh thoi gian con lai cua ma QR tren the hien thi.
// Nhan vao: expiryDate la ngay het han cua ma.
// Tra ve: chuoi mo ta thoi gian con lai hoac trang thai het han.
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

// Ham nay dung de format ngay theo giao dien en-GB cho card dashboard user.
// Nhan vao: value la ngay can hien thi.
// Tra ve: chuoi ngay da format hoac "Pending update" neu khong hop le.
const formatDateLabel = (value) => {
  if (!value) {
    return "Pending update";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Pending update";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Ham nay dung de render mot card QR that cho tab history/active cua user dashboard.
// Nhan vao: scan la du lieu item dashboard va onViewDetails la ham mo modal chi tiet.
// Tra ve: JSX card hien thi 2 anh QR, metadata san pham va trang thai scan.
export default function ScanCard({ scan, onDelete, onViewDetails }) {
  const timeLeft = calculateTimeLeft(scan.expiryDate);
  const isExpired = timeLeft === "Expired";

  return (
    <article className="scan-card">
      <div className="scan-header scan-header-stacked">
        <div>
          <span className="scan-type">{scan.qrType}</span>
          <h4 className="scan-card-title">
            <Package size={16} />
            {scan.productName || "Tracked QR"}
          </h4>
          <p className="scan-card-brand">{scan.brandName || "Pending brand"}</p>
        </div>

        <div className={`scan-status-chip ${scan.statusTone || "active"}`}>
          <ShieldCheck size={14} />
          <span>{scan.statusLabel || "ACTIVE"}</span>
        </div>
      </div>

      <div className="scan-qr-pair">
        <div className="scan-qr-box">
          <small>Website Link QR</small>
          {scan.qrImages?.websiteLink ? <img src={scan.qrImages.websiteLink} alt="Website link QR" className="qr-thumb qr-thumb-large" /> : <div className="scan-qr-placeholder">No QR</div>}
        </div>

        <div className="scan-qr-box">
          <small>Saved Scan QR</small>
          {scan.qrImages?.savedScan ? <img src={scan.qrImages.savedScan} alt="Saved scan QR" className="qr-thumb qr-thumb-large" /> : <div className="scan-qr-placeholder">No QR</div>}
        </div>
      </div>

      <div className="scan-meta-grid">
        <div className="scan-meta-item">
          <span className="scan-meta-label">Expiry Date</span>
          <strong>
            <CalendarDays size={14} />
            {formatDateLabel(scan.expiryDate)}
          </strong>
        </div>

        <div className="scan-meta-item">
          <span className="scan-meta-label">Remaining</span>
          <strong className={`time-left ${!isExpired ? "active" : ""}`}>
            <Clock size={14} />
            {timeLeft}
          </strong>
        </div>
      </div>

      <div className="scan-actions">
        <span className="scan-count" role="button" tabIndex={0} onClick={onViewDetails} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onViewDetails?.()}>
          <Search size={14} /> Scanned {scan.scanCount ?? 0} times
        </span>

        <div className="scan-action-buttons">
          {typeof onDelete === "function" ? (
            <button type="button" className="scan-delete-btn" onClick={onDelete}>
              <Trash2 size={14} />
              Remove
            </button>
          ) : null}

          <button type="button" className="view-btn" onClick={onViewDetails}>
            View Product
          </button>
        </div>
      </div>
    </article>
  );
}
