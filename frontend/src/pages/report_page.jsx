import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";

export default function AdminReportPage() {
  const [logs, setLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filterEmail, setFilterEmail] = useState("");

  const isAuthenticated = sessionStorage.getItem("admin_login") === "true";

  useEffect(() => {
    if (!isAuthenticated) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/report/logs`)
      .then(res => res.json())
      .then(setLogs);

    fetch(`${import.meta.env.VITE_API_URL}/api/report/orders`)
      .then(res => res.json())
      .then(setOrders);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">未授權</h1>
        <p>您尚未登入管理員帳號，請先登入。</p>
      </div>
    );
  }

  const filteredOrders = orders.filter(o =>
    filterEmail === "" || o.email.toLowerCase().includes(filterEmail.toLowerCase())
  );

  const filteredLogs = logs.filter(l =>
    filterEmail === "" || l.email.toLowerCase().includes(filterEmail.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">管理後台報表</h1>
      <button onClick={() => {
        sessionStorage.removeItem("admin_login");
        window.location.href = "/admin/login";
      }} className="ml-auto bg-red-500 text-white px-3 py-1 rounded">
        登出
      </button>
      <div className="mb-4 flex items-center gap-4">
        <input
          type="text"
          className="border rounded px-3 py-1"
          placeholder="輸入 Email 篩選"
          value={filterEmail}
          onChange={e => setFilterEmail(e.target.value)}
        />
        <CSVLink data={filteredOrders} filename="orders_report.csv" className="bg-blue-600 text-white px-4 py-1 rounded">
          匯出訂單 CSV
        </CSVLink>
        <CSVLink data={filteredLogs} filename="logs_report.csv" className="bg-green-600 text-white px-4 py-1 rounded">
          匯出紀錄 CSV
        </CSVLink>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-2">📋 訂單報表</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2">姓名</th>
                <th className="px-3 py-2">暱稱</th>
                <th className="px-3 py-2">電話</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">座位</th>
                <th className="px-3 py-2">時間</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className="border px-3 py-1">{order.name}</td>
                  <td className="border px-3 py-1">{order.nickname}</td>
                  <td className="border px-3 py-1">{order.phone}</td>
                  <td className="border px-3 py-1">{order.email}</td>
                  <td className="border px-3 py-1">{order.seat_code}</td>
                  <td className="border px-3 py-1">{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">🕵️ 異動紀錄 Logs</h2>
        <div className="overflow-x-auto">
          <table className="table-auto w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2">動作</th>
                <th className="px-3 py-2">座位</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">時間</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td className="border px-3 py-1">{log.action}</td>
                  <td className="border px-3 py-1">{log.seat_code}</td>
                  <td className="border px-3 py-1">{log.email}</td>
                  <td className="border px-3 py-1">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
