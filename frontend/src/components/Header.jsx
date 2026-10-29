import React from "react";
import { BarChart3, HelpCircle, RotateCcw, Wallet } from "lucide-react";

export function Header({
  account,
  connected,
  onConnectWallet,
  onDisconnectWallet,
  onStartGame,
  onOpenHowToPlay,
  onOpenStatistics,
  isSubmitting,
  gameMode,
  onGameModeChange,
}) {
  return (
    <header className="border-b border-[#3a3a3c] bg-[#121213]/90 backdrop-blur sticky top-0 z-30 px-4 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenHowToPlay}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
            title="How to play"
          >
            <HelpCircle size={22} />
          </button>
          <button
            onClick={onOpenStatistics}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
            title="Statistics"
          >
            <BarChart3 size={20} />
          </button>
          <select
            value={gameMode}
            onChange={(event) => onGameModeChange(event.target.value)}
            className="max-w-28 rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-[11px] font-semibold text-neutral-200 outline-none cursor-pointer"
            title="Select game mode"
            aria-label="Game mode"
          >
            <option className="bg-neutral-900 text-white" value="petra">Petra</option>
            <option className="bg-neutral-900 text-white" value="burner">Burner</option>
            <option className="bg-neutral-900 text-white" value="sim">Simulation</option>
          </select>
        </div>

        <div className="text-center">
          <span className="text-lg font-black tracking-widest uppercase">WORDLE</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onStartGame}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400"
            title="Start / Reset Game"
          >
            <RotateCcw size={20} className={isSubmitting ? "animate-spin" : ""} />
          </button>

          {connected ? (
            <button
              onClick={onDisconnectWallet}
              className="text-xs font-mono bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-2.5 py-1.5 rounded-lg text-emerald-400 flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </button>
          ) : (
            <button
              onClick={onConnectWallet}
              className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
            >
              <Wallet size={14} />
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
