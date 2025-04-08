// src/App.jsx
import React from 'react';
import { Routes, Route } from "react-router-dom";

import SeatSelectionPage from './pages/seat_selection.jsx'
import FormPage from "./pages/seat_form.jsx";
import CancelLookupPage from "./pages/cancel_lookup.jsx";
import AdminReportPage from "./pages/report_page.jsx"
import AdminLoginPage from "./pages/admin_login.jsx"


import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SeatSelectionPage />} />
      <Route path="/form" element={<FormPage />} />
      <Route path="/cancel" element={<CancelLookupPage />} />
      <Route path="/admin/report" element={<AdminReportPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
    </Routes>
  );
}
export default App;
