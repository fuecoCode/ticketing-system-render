import React, { useState } from "react";
import NavBar from "../components/NavBar";

export default function CancelLookupPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [form, setForm] = useState({ email: "", phone: "" });
  const [orders, setOrders] = useState([]);
  // const [selectedSeat, setSelectedSeat] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fetchOrders = async () => {
    const res = await fetch("http://localhost:3001/api/orders/lookup", {
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


  const handleCancel = async (seat_code) => {
    const res = await fetch("http://localhost:3001/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, seat_code }), // 改這裡！
    });
    console.log("Cancel request:", { email, phone, seat_code });
    const data = await res.json();
    if (data.success) {
      alert("Cancellation successful");
      setOrders((prev) => prev.filter((o) => o.seat_code !== seat_code));
    } else {
      alert("Cancellation failed");
    }
  };


  const handleSendCode = async () => {
  const res = await fetch("http://localhost:3001/api/verify/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone })
    });
    const data = await res.json();
    if (data.success) alert("驗證碼已寄出，請查看信箱");
    else alert("寄送失敗：" + (data.error || "未知錯誤"));
  };

  const handleVerifyCode = async () => {
    const res = await fetch("http://localhost:3001/api/verify/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, code })
    });
    const data = await res.json();
    if (data.success) {
      setIsVerified(true);
      alert("驗證成功！");
      fetchOrders(); // 驗證通過後查詢訂票
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
            <li key={o.id} className="flex justify-between items-center border p-2">
              <span>{o.seat_code}</span>
              <button
                onClick={() => handleCancel(o.seat_code)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                取消
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}
    </div>
  );
}
