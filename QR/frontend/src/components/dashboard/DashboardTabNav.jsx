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
