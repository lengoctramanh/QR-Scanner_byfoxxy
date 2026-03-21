// Ham nay dung de render thanh tab dieu huong dung chung cho cac dashboard.
// Nhan vao: items la danh sach tab, activeTab la tab dang duoc chon, onChange la ham doi tab.
// Tra ve: JSX danh sach nut tab.
export default function DashboardTabNav({ items, activeTab, onChange }) {
  return (
    <div className="tab-nav">
      {items.map(({ id, icon: Icon, label }) => (
        <button key={id} type="button" className={`tab-btn ${activeTab === id ? "active" : ""}`} onClick={() => onChange(id)}>
          <Icon size={18} /> {label}
        </button>
      ))}
    </div>
  );
}
