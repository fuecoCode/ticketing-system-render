// src/components/SeatMap.jsx
import React, { useState } from 'react';

const seatConfig = {
  left: { rows: ['A', 'B', 'C'], cols: 4, price: 1200 },
  center: { rows: ['D', 'E', 'F'], cols: 6, price: 1500 },
  right: { rows: ['A', 'B', 'C'], cols: 4, price: 1200 },
};

const generateSeats = () => {
  const seatData = [];
  for (const [zone, { rows, cols, price }] of Object.entries(seatConfig)) {
    for (const row of rows) {
      for (let num = 1; num <= cols; num++) {
        seatData.push({
          id: `${zone}-${row}-${num}`,
          row,
          number: num,
          zone,
          price,
          status: Math.random() < 0.1 ? 'booked' : 'available',
        });
      }
    }
  }
  return seatData;
};

const SeatMap = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const seatData = generateSeats();

  const handleClick = (seat) => {
    if (seat.status !== 'available') return;
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const getColor = (seat) => {
    if (seat.status === 'booked') return 'bg-gray-400 cursor-not-allowed';
    if (seat.status === 'unavailable') return 'bg-gray-300 cursor-not-allowed';
    if (selectedSeats.some((s) => s.id === seat.id)) return 'bg-teal-400';

    switch (seat.price) {
      case 1800:
        return 'bg-red-400';
      case 1500:
        return 'bg-pink-400';
      case 1200:
        return 'bg-orange-300';
      default:
        return 'bg-green-300';
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">座位圖</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['left', 'center', 'right'].map((zone) => (
          <div key={zone}>
            <h3 className="text-lg font-semibold mb-2 text-center">{zone.toUpperCase()} 區</h3>
            <div className="grid grid-cols-6 gap-1">
              {seatData
                .filter((s) => s.zone === zone)
                .map((seat) => (
                  <div
                    key={seat.id}
                    className={`w-10 h-10 flex items-center justify-center rounded text-sm text-white ${getColor(seat)}`}
                    onClick={() => handleClick(seat)}
                  >
                    {seat.number}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">已選座位：</h3>
        {selectedSeats.length === 0 ? (
          <p>尚未選擇</p>
        ) : (
          <ul className="list-disc ml-6">
            {selectedSeats.map((s) => (
              <li key={s.id}>{`${s.zone}-${s.row}-${s.number}`} (NT${s.price})</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SeatMap;