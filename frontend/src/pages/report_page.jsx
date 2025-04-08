import { useEffect, useState } from "react";

export default function AdminReportPage() {
  const [logs, setLogs] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/report/logs")
      .then(res => res.json())
      .then(setLogs);

    fetch("/api/report/orders")
      .then(res => res.json())
      .then(setOrders);
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">管理後台報表</h1>

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
              {orders.map(order => (
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
              {logs.map(log => (
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
