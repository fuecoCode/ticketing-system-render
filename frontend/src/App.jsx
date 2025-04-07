// src/App.jsx
import React from 'react';
import { Routes, Route } from "react-router-dom";

import SeatSelectionPage from './pages/seat_selection.jsx'
import FormPage from "./pages/seat_form.jsx";
import CancelLookupPage from "./pages/cancel_lookup.jsx";


import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SeatSelectionPage />} />
      <Route path="/form" element={<FormPage />} />
      <Route path="/cancel" element={<CancelLookupPage />} />
    </Routes>
  );
}
export default App;
