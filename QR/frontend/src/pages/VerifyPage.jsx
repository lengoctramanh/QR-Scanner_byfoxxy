import { useEffect, useState } from "react";
import axios from "axios";

import LoadingState from "../components/verify/LoadingState";
import ErrorState from "../components/verify/ErrorState";
import AuthenticResult from "../components/verify/AuthenticResult";
import FakeResult from "../components/verify/FakeResult";
import VerifyingResult from "../components/verify/VerifyingResult";

export default function VerifyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setError("Mã QR không hợp lệ");
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:8080/api/verify/${token}`)
      .then((res) => {
        setResult(res.data);
      })
      .catch(() => {
        setError("Không thể kết nối server");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // UI logic
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  switch (result.status) {
    case "authentic":
      return <AuthenticResult data={result} />;
    case "fake":
      return <FakeResult data={result} />;
    case "verifying":
      return <VerifyingResult data={result} />;
    default:
      return <ErrorState message="Không xác định trạng thái" />;
  }
}