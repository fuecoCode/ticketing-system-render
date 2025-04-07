import React from "react";
import { useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => navigate("/")}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        選位
      </button>
{/*      <button
        onClick={() => navigate("/form")}
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        填資料
      </button>*/}
      <button
        onClick={() => navigate("/cancel")}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        取消訂票
      </button>
    </div>
  );
}
