import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [phone] = useState(location.state?.phone || ""); // 若後端驗證用得到
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();

    if (data.success) {
      setMessage("✅ 驗證成功，即將跳轉...");
      sessionStorage.setItem("booking_success", "true");
      setTimeout(() => navigate("/success"), 1500);
    }else {
      setMessage(`❌ ${data.error || data.message || "驗證失敗，請稍後再試。"}`);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage("❗ 請先輸入 Email 才能重發驗證碼");
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setMessage(data.success ? "📨 驗證碼已重新寄出" : `❌ ${data.error}`);
    if (data.success) setResendTimer(60); // 鎖定 60 秒
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">驗證 Email</h1>
      <input
        type="email"
        className="border w-full mb-2 px-3 py-2 rounded"
        placeholder="請輸入 Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        className="border w-full mb-2 px-3 py-2 rounded"
        placeholder="請輸入驗證碼"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        onClick={handleVerify}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-2"
      >
        驗證
      </button>
      <button
        onClick={handleResend}
        disabled={resendTimer > 0}
        className={`w-full px-4 py-2 rounded ${
          resendTimer > 0
            ? "bg-gray-400 text-white"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {resendTimer > 0 ? `重新發送 (${resendTimer}s)` : "重新發送驗證碼"}
      </button>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
