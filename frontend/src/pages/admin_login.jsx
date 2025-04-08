import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // console.log(`${password} , ${import.meta.env.VITE_ADMIN_PASSWORD}`);
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_login", "true");
      navigate("/admin/report");
    } else {
      setError("密碼錯誤，請再試一次。");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <NavBar />
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">管理員登入</h1>
        {error && <p className="text-red-600 mb-2 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="輸入管理密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            登入
          </button>
        </form>
      </div>
    </div>
  );
}
