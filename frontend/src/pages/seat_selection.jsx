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
    const mid = [12, 10, 8, 6, 4, 2, 1, 3, 5, 7, 9, 11].map(n => `${r}${n}`)
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
    const res = await fetch("http://localhost:3001/api/seats/status");
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
    if (seat.status !== "available") return;

    setSelectedSeats((prev) => {
      if (prev.includes(seat.code)) {
        // 已選過 → 取消選擇
        return prev.filter((code) => code !== seat.code);
      } else if (!prev.includes(seat.code) && prev.length >= 6) {
          console.log(`over 6 seats`)
          return prev;
      }else {
        // 新選擇 → 加入
        return [...prev, seat.code];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedSeats) {
      // TODO: Send lock request to backend
      console.log("Locking seat:", selectedSeats);
      navigate("/form", { state: { selectedSeats } });
      // Navigate to form page (e.g. using React Router)
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
    <NavBar />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Concert Seat Selection</h1>
        </div>
      <div className="space-y-2 mb-4">
        {seats.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-26 gap-1">
            {row.map((seat, colIndex) => (
              <div
                key={colIndex}
                className={`p-1 border rounded text-center text-xs
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

      <div className="mt-4">
        <p className="mb-2">
          Selected Seats: {selectedSeats.length ? selectedSeats.join(", ") : "None"}
        </p>
        <Button disabled={selectedSeats.length === 0} onClick={handleConfirm}>
          Confirm Selection
        </Button>
      </div>
    </div>
  );
}
