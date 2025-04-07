import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import '../index.css'
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

const generateSeatLayout = () => {
  const layout = [];

  for (let r of rows) {
    const left = [24, 22, 20, 18, 16, 14].map(n => `${r}${n}`);
    const mid = [12, 10, 8, 6, 4, 2, 1, 3, 5, 7, 9, 11].map(n => `${r}${n}`);
    const right = [13, 15, 17, 19, 21, 23].map(n => `${r}${n}`);
    layout.push([...left, "", ...mid, "", ...right]);
  }

  return layout;
};

const seatLayout = generateSeatLayout();

export default function SeatSelectionPage() {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const navigate = useNavigate();

  const fetchSeats = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seats/status`);
    const data = await res.json();
    const updated = seatLayout.map((row) =>
      row.map((code) => (code ? { code, status: data[code]?.status || "available" } : null))
    );
    setSeats(updated);
  };

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSeatClick = (seat) => {
    if (!seat || seat.status !== "available") return;

    setSelectedSeats((prev) => {
      if (prev.includes(seat.code)) {
        return prev.filter((code) => code !== seat.code);
      } else if (prev.length >= 6) {
        alert(`Over 6 seats`);
        return prev;
      } else {
        return [...prev, seat.code];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedSeats.length > 0) {
      console.log("Locking seat:", selectedSeats);
      navigate("/form", { state: { selectedSeats } });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-full sm:max-w-4xl mx-auto">
      <NavBar />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Concert Seat Selection</h1>
      </div>

      {/* 座位區塊 */}
      <div
          className="overflow-x-auto touch-pan-x"
          style={{
            touchAction: "pan-x pan-y",
            WebkitOverflowScrolling: "touch",
          }}
        >
        <div className="space-y-2 mb-4 min-w-[650px]">
          {seats.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[repeat(26,1fr)] gap-1">
              {row.map((seat, colIndex) => (
                <div
                  key={colIndex}
                  className={`w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center border rounded text-[10px] sm:text-xs
                    ${!seat ? "invisible" : "cursor-pointer"}
                    ${seat?.status === "booked" ? "bg-gray-400 cursor-not-allowed" : ""}
                    ${seat?.status === "locked" ? "bg-yellow-300" : ""}
                    ${seat?.status === "available" ? "bg-green-200" : ""}
                    ${selectedSeats.includes(seat?.code) ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => handleSeatClick(seat)}
                >
                  {seat?.code || ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 下方資訊 */}
      <div className="mt-4">
        <p className="mb-2 text-sm sm:text-base">
          Selected Seats: {selectedSeats.length ? selectedSeats.join(", ") : "None"}
        </p>
        <Button disabled={selectedSeats.length === 0} onClick={handleConfirm}>
          Confirm Selection
        </Button>
      </div>
    </div>
  );
}
