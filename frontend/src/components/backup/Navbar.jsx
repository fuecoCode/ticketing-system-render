import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex justify-end mb-4">
      <button
        onClick={handleLogout}
        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
      >
        登出
      </button>
    </div>
  );
};

export default Navbar;
