import React from "react";
import { X, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1b] border border-[#3a3a3c] rounded-xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold tracking-wide uppercase mb-4 text-center">
          How to Play On-Chain Wordle
        </h2>

        <div className="space-y-4 text-sm text-neutral-300">
          <p>Guess the Wordle in 6 tries.</p>
          <p>
            Each guess must be a valid 5-letter word. Every guess is verified
            cryptographically by an <strong>Aptos Move smart contract</strong>!
          </p>

          <div className="border-t border-b border-[#3a3a3c] py-3 space-y-2">
            <p className="font-semibold text-white">Examples:</p>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#538d4e] flex items-center justify-center font-bold text-lg rounded">
                W
              </div>
              <span>
                <strong>W</strong> is in the word and in the correct spot (Green = 2).
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#b59f3b] flex items-center justify-center font-bold text-lg rounded">
                I
              </div>
              <span>
                <strong>I</strong> is in the word but in the wrong spot (Yellow = 1).
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#3a3a3c] flex items-center justify-center font-bold text-lg rounded">
                U
              </div>
              <span>
                <strong>U</strong> is not in the word in any spot (Gray = 0).
              </span>
            </div>
          </div>

          <div className="bg-neutral-900/60 p-3 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={16} /> Web3 Architecture (Track 3)
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The smart contract stores player game sessions and executes the two-pass Wordle matching algorithm on-chain to ensure zero client-side cheating.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
