import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";

function useBlockBackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unblock = window.history.pushState
      ? (function () {
          window.history.pushState(null, "", window.location.href);
          window.addEventListener("popstate", handleBack);

          function handleBack() {
            navigate("/", { replace: true });
          }

          return () => {
            window.removeEventListener("popstate", handleBack);
          };
        })()
      : () => {};

    return unblock;
  }, [navigate, location]);
};

export default function FormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSeats = location.state?.selectedSeats || [];
  const bookingToken = location.state?.bookingToken;

  useBlockBackNavigation();

  useEffect(() => {
    if (
      sessionStorage.getItem("allowForm") !== "yes" ||
      !bookingToken
    ) {
      alert("Unauthorized access. Redirecting.");
      navigate("/", { replace: true });
    } else {
      sessionStorage.removeItem("allowForm");
    }
  }, [navigate, bookingToken]);

  // ✅ 離開頁面釋放座位 + 跳出確認提示
  useEffect(() => {
    // const handleBeforeUnload = (e) => {
    //   e.preventDefault();
    //   e.returnValue = ""; // 必要，讓提示能顯示（不能客製文字）
    // };

    const handleUnload = () => {
      const payload = JSON.stringify({ seats: selectedSeats });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(`${import.meta.env.VITE_API_URL}/api/seats/release`, blob);
    };

    // window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      // window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      releaseSeats(); // React unmount 時釋放
    };
  }, [selectedSeats]);


  useEffect(() => {
    if (selectedSeats.length === 0) {
      alert("No seats selected. Redirecting to seat selection page.");
      navigate("/", { replace: true });
    } 
  }, [selectedSeats, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    phone: "",
    email: "",
  });

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTimeout = async () => {
    try {
      await releaseSeats();
      alert("Time is up! Your seats were released. Please start over.");
    } catch (err) {
      console.error("Error releasing seats:", err);
    } finally {
      navigate("/", { replace: true });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false); // ❗放這裡：component 最上層

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, seats: selectedSeats, bookingToken }),
      });

      if (res.status === 409) {
        alert("部分座位已被預訂，請重新選擇。");
        return;
      }

      const data = await res.json();
      if (data.success) {
        alert("預約成功，請前往信箱查看驗證碼！");
        navigate("/verify", {
          state: {
            email: formData.email,
            phone: formData.phone,
          },
          replace: true,
        });
      } else {
        alert("訂票失敗！", err);
      }
    } catch (err) {
      console.error(err);
      alert("送出訂票時發生錯誤", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await releaseSeats();
      alert("You cancelled the booking. Seats released.");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error cancelling and releasing seats:", error);
      alert("Failed to cancel. Try again.");
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const releaseSeats = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/seats/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats: selectedSeats }),
      });
    } catch (err) {
      console.error("Error releasing seats:", err);
    }
  };

  const progressPercent = ((300 - timeLeft) / 300) * 100;
  return (
    <div className="p-6 max-w-xl mx-auto">
      <NavBar />
      <h2 className="text-2xl font-bold mb-4">Fill Your Information</h2>
      <p className="mb-2">Selected Seats: {selectedSeats.join(", ")}</p>
      <div className="mb-4">
        <p className="text-sm text-red-500 font-semibold mb-1">
          Time Remaining: {formatTime(timeLeft)}
        </p>
        <progress
          value={progressPercent}
          max="100"
          className="w-full h-3 rounded bg-gray-200"
        />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="nickname"
          placeholder="Nickname"
          value={formData.nickname}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded text-white ${
            isSubmitting ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit Booking"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
