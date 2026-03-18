import { Pencil } from "lucide-react";
import "./Code.css";

export default function Code() {
  return (
    <>
      <h1 className="page-title">Code</h1>
      <div className="title-divider"></div>

      <section className="card">
        <div className="card-hd">
          <span className="pencil" aria-hidden="true">
            <Pencil size={20} />
          </span>
          <span>Enter Code Manually</span>
        </div>

        <div className="card-divider"></div>

        <div className="input-wrap">
          <input type="text" placeholder="Enter verification code" />
        </div>

        <button className="primary" type="button">
          VERIFY
        </button>
      </section>
    </>
  );
}
