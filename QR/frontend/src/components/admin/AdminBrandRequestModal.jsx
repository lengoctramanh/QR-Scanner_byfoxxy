import { Check, Download, Eye, FileArchive, RefreshCcw, X } from "lucide-react";
import { DetailModal, EmptyState, StatusPill } from "./AdminDashboardShared";
import { formatDateOnly, formatDateTime, formatGenderLabel } from "../../utils/adminDashboardUtils";

// Ham nay dung de render danh sach tep dinh kem va nut download trong modal review brand.
// Nhan vao: attachments la mang metadata tep dinh kem cua request.
// Tra ve: JSX danh sach tep co nut mo/tai xuong hoac thong bao file khong kha dung.
function AttachmentList({ attachments }) {
  if (!attachments.length) {
    return <EmptyState icon={FileArchive} title="No attachments submitted" description="This registration package does not include any supporting files." />;
  }

  return (
    <div className="admin-attachment-list">
      {attachments.map((attachment) => (
        <article key={attachment.id} className="admin-attachment-card">
          <div className="admin-attachment-copy">
            <h5>{attachment.fileName}</h5>
            <p>{attachment.isAvailable ? "Ready to open or download." : attachment.note}</p>
          </div>

          <div className="admin-attachment-actions">
            {attachment.isAvailable ? (
              <>
                <a className="admin-action-btn ghost" href={attachment.downloadUrl} target="_blank" rel="noreferrer">
                  <Eye size={16} /> Open
                </a>
                <a className="admin-action-btn success" href={attachment.downloadUrl} download>
                  <Download size={16} /> Download
                </a>
              </>
            ) : (
              <button type="button" className="admin-action-btn ghost" disabled>
                <FileArchive size={16} /> Unavailable
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

// Ham nay dung de render modal review chi tiet cho mot yeu cau dang ky brand.
// Nhan vao: requestDetail, isLoading, activeActionRequestId va cac callback dong/approve/reject modal.
// Tra ve: JSX modal chi tiet day du hoac loading state trong luc dang fetch detail.
export default function AdminBrandRequestModal({ requestDetail, isLoading, activeActionRequestId, onClose, onApprove, onReject }) {
  if (!requestDetail && !isLoading) {
    return null;
  }

  const modalTitle = requestDetail?.brandName || "Brand request";
  const modalSubtitle = requestDetail ? `${requestDetail.requestStatus} / ${requestDetail.requestId}` : "Loading details";
  const isActionRunning = requestDetail ? activeActionRequestId === requestDetail.requestId : false;

  return (
    <DetailModal title={modalTitle} subtitle={modalSubtitle} onClose={onClose}>
      {isLoading || !requestDetail ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">
            <RefreshCcw size={22} className="spin" />
          </div>
          <h4>Loading request details</h4>
          <p>The latest registration package details are being fetched from the database.</p>
        </div>
      ) : (
        <div className="admin-modal-stack">
          <div className="admin-modal-chip-row">
            <StatusPill value={requestDetail.requestStatus} />
          </div>

          <div className="admin-detail-grid">
            <div className="admin-detail-card">
              <span>Full name</span>
              <strong>{requestDetail.fullName || "Not updated"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Gender</span>
              <strong>{formatGenderLabel(requestDetail.gender)}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Sign-in username</span>
              <strong>{requestDetail.loginIdentifier || "Not updated"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Contact email</span>
              <strong>{requestDetail.email || "Not provided"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Contact phone</span>
              <strong>{requestDetail.phone || "Not provided"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Date of birth</span>
              <strong>{formatDateOnly(requestDetail.dob)}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Brand name</span>
              <strong>{requestDetail.brandName || "Not updated"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Tax ID</span>
              <strong>{requestDetail.taxId || "Not updated"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Industry</span>
              <strong>{requestDetail.industry || "Not updated"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Website</span>
              <strong>{requestDetail.website || "Not provided"}</strong>
            </div>
            <div className="admin-detail-card wide">
              <span>Product categories</span>
              <strong>{requestDetail.productCategories || "Not provided"}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Submitted at</span>
              <strong>{formatDateTime(requestDetail.createdAt)}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Last updated</span>
              <strong>{formatDateTime(requestDetail.lastUpdatedAt)}</strong>
            </div>
          </div>

          <section className="admin-detail-note">
            <h4>Submitted files</h4>
            <AttachmentList attachments={requestDetail.attachments || []} />
          </section>

          <section className="admin-detail-note">
            <h4>Admin note</h4>
            <p>{requestDetail.adminNote || "No review note has been recorded yet."}</p>
          </section>

          <div className="admin-modal-actions">
            <button type="button" className="admin-action-btn success" onClick={() => onApprove(requestDetail.requestId)} disabled={isActionRunning}>
              <Check size={16} /> {isActionRunning ? "Saving..." : "Approve"}
            </button>
            <button type="button" className="admin-action-btn danger" onClick={() => onReject(requestDetail.requestId)} disabled={isActionRunning}>
              <X size={16} /> Reject
            </button>
          </div>
        </div>
      )}
    </DetailModal>
  );
}
