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
  isDevSimulation,
}) {
  return (
    <header className="border-b border-[#3a3a3c] bg-[#121213]/90 backdrop-blur sticky top-0 z-30 px-4 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenHowToPlay}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
            title="How to play & On-Chain rules"
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
            className={`max-w-28 rounded-lg border px-2 py-1.5 text-[11px] font-semibold outline-none cursor-pointer ${
              isDevSimulation
                ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
            }`}
            title="Select game mode"
            aria-label="Game mode"
          >
            <option className="bg-neutral-900 text-white" value="petra">Petra</option>
            <option className="bg-neutral-900 text-white" value="burner">Burner</option>
            <option className="bg-neutral-900 text-white" value="sim">Simulation</option>
          </select>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-widest uppercase flex items-center justify-center gap-1.5">
            <span>WORDLE</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-700/80 text-emerald-100 tracking-normal border border-emerald-500/30">
              APTOS
            </span>
          </h1>
          <p className="text-[11px] text-neutral-400 font-mono">
            {isDevSimulation ? "Local Simulation Mode" : "100% On-Chain Verification"}
          </p>
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
