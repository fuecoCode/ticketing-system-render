// src/components/ui/button.jsx
import "@/index.css"

export function Button({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-gray-400"
    >
      {children}
    </button>
  );
}
