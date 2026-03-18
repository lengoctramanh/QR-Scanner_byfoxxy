import Header from "./Header";

export default function PageShell({ children }) {
  return (
    <div className="page-container">
      <div className="main-panel">
        <Header />
        {children}
      </div>
    </div>
  );
}
