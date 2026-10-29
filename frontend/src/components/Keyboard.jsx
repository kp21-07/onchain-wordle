import React, { useEffect } from "react";
import { Delete } from "lucide-react";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export function Keyboard({ onKeyPress, letterStatuses, disabled }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled) return;

      if (e.key === "Enter") {
        onKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        onKeyPress("BACKSPACE");
      } else {
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
          onKeyPress(key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress, disabled]);

  const getKeyColor = (key) => {
    const status = letterStatuses[key];
    if (status === 2) return "bg-[#538d4e] text-white hover:bg-[#467742]";
    if (status === 1) return "bg-[#b59f3b] text-white hover:bg-[#998632]";
    if (status === 0) return "bg-[#3a3a3c] text-neutral-400 hover:bg-[#323234]";
    return "bg-[#818384] text-white hover:bg-[#727475]";
  };

  return (
    <div className="w-full max-w-lg mx-auto px-2 pb-6 select-none flex flex-col gap-1.5">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5 touch-manipulation">
          {row.map((key) => {
            const isWide = key === "ENTER" || key === "BACKSPACE";
            const colorClass = getKeyColor(key);

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKeyPress(key)}
                className={`h-14 font-bold rounded text-xs sm:text-sm flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none ${
                  isWide ? "px-3 sm:px-4 text-xs font-semibold" : "flex-1 max-w-[42px]"
                } ${colorClass}`}
              >
                {key === "BACKSPACE" ? <Delete size={20} /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
