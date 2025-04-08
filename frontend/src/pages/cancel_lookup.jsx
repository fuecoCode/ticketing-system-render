import React, { useState } from "react";
import NavBar from "../components/NavBar";

export default function CancelLookupPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const fetchOrders = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone })
    });
    const data = await res.json();
    if (data.success) {
      setOrders(data.orders);
    } else {
      alert("查詢失敗：" + data.error);
    }
  };

  const handleToggleSelect = (seat_code) => {
    setSelectedSeats((prev) =>
      prev.includes(seat_code)
        ? prev.filter((s) => s !== seat_code)
        : [...prev, seat_code]
    );
  };

  const handleBulkCancel = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, seats: selectedSeats })
    });
    const data = await res.json();
    if (data.success) {
      alert("取消成功");
      setOrders((prev) => prev.filter((o) => !selectedSeats.includes(o.seat_code)));
      setSelectedSeats([]);
    } else {
      alert("取消失敗：" + data.error);
    }
  };

  const handleSendCode = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone })
    });
    const data = await res.json();
    if (data.success) alert("驗證碼已寄出，請查看信箱");
    else alert("寄送失敗：" + (data.error || "未知錯誤"));
  };

  const handleVerifyCode = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, code })
    });
    const data = await res.json();
    if (data.success) {
      setIsVerified(true);
      alert("驗證成功！");
      fetchOrders();
    } else {
      alert("驗證失敗或已過期！");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <NavBar />
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="tel"
          placeholder="Phone"
          className="border p-2 w-full"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          onClick={handleSendCode}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          發送驗證碼
        </button>

        <input
          type="text"
          placeholder="輸入驗證碼"
          className="border p-2 w-full"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          onClick={handleVerifyCode}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          驗證
        </button>
      </div>

      {isVerified && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">已訂座位</h2>
          <ul className="space-y-2">
            {orders.map((o) => (
              <li
                key={o.id}
                className={`flex justify-between items-center border p-2 rounded ${
                  selectedSeats.includes(o.seat_code) ? "bg-red-100" : ""
                }`}
              >
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedSeats.includes(o.seat_code)}
                    onChange={() => handleToggleSelect(o.seat_code)}
                  />
                  <span>{o.seat_code}</span>
                </label>
              </li>
            ))}
          </ul>

          {selectedSeats.length > 0 && (
            <div className="mt-4">
              <button
                onClick={handleBulkCancel}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                取消選取的座位（{selectedSeats.length}）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}