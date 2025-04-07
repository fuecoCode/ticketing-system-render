import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function FormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSeats = location.state?.selectedSeats || [];

  // ✅ 離開頁面釋放座位 + 跳出確認提示
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // 必要，讓提示能顯示（不能客製文字）
    };

    const handleUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_URL}/api/seats/release`,
        JSON.stringify({ seats: selectedSeats })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      releaseSeats(); // React unmount 時釋放
    };
  }, [selectedSeats]);


  useEffect(() => {
    if (selectedSeats.length === 0) {
      alert("No seats selected. Redirecting to seat selection page.");
      navigate("/");
    } else {
      // 🔐 Lock selected seats on mount
      fetch(`${import.meta.env.VITE_API_URL}/api/seats/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats: selectedSeats }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Locked seats:", data.lockedSeats);
        })
        .catch((err) => {
          console.error("Error locking seats:", err);
        });
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
    const timer = setInterval(async () => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          // 🔓 Release locked seats on timeout
          fetch(`${import.meta.env.VITE_API_URL}/api/seats/release`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seats: selectedSeats }),
          })
            .then((res) => res.json())
            .then(() => {
              alert("Time is up! Your seats were released. Please start over.");
              navigate("/");
            })
            .catch((err) => {
              console.error("Error releasing seats:", err);
              navigate("/");
            });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, selectedSeats]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, seats: selectedSeats }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Booking successful!");
        navigate("/");
      } else {
        alert("Booking failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting booking.");
    }
  };

  const handleCancel = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/seats/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats: selectedSeats }),
      });
      alert("You cancelled the booking. Seats released.");
      navigate("/");
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
    await fetch(`${import.meta.env.VITE_API_URL}/api/seats/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seats: selectedSeats }),
    });
  };


  return (
    <div className="p-6 max-w-xl mx-auto">
    <NavBar />
      <h2 className="text-2xl font-bold mb-4">Fill Your Information</h2>
      <p className="mb-4">Selected Seats: {selectedSeats.join(", ")}</p>
      <p className="mb-4 text-red-500">Time Remaining: {formatTime(timeLeft)}</p>
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
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit Booking
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
