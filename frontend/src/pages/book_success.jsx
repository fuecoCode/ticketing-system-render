import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const allowed = sessionStorage.getItem("booking_success");
    if (allowed !== "true") {
      navigate("/", { replace: true });
    } else {
      // 用完即清除，避免重整再次進入
      sessionStorage.removeItem("booking_success");
    }
  }, [navigate]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">🎉 訂票成功！</h1>
      <p className="text-lg mb-4">我們已收到您的訂單，請準時前往音樂會現場。</p>
      <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        返回首頁
      </a>
    </div>
  );
}
