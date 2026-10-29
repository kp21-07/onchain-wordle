import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Header } from "./components/Header";
import { WordleBoard } from "./components/WordleBoard";
import { Keyboard } from "./components/Keyboard";
import { HowToPlayModal } from "./components/HowToPlayModal";
import {
  CONTRACT_ADDRESS,
  MODULE_NAME,
  aptosClient,
  stringToBytes,
  bytesToString,
} from "./utils/aptosConfig";
import { AlertCircle, CheckCircle, Play, Sparkles } from "lucide-react";
import { getOrCreateBurnerWallet } from "./utils/burnerWallet";
import { VALID_WORDS } from "./utils/validWords";

const EMPTY_DISTRIBUTION = [0, 0, 0, 0, 0, 0];
const SIMULATION_STATS_KEY = "wordle:simulation-stats";
const loadSimulationStats = (storageKey = SIMULATION_STATS_KEY) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || !Array.isArray(saved.distribution)) return null;
    return {
      played: Number(saved.played) || 0,
      won: Number(saved.won) || 0,
      currentStreak: Number(saved.currentStreak) || 0,
      bestStreak: Number(saved.bestStreak) || 0,
      distribution: saved.distribution.slice(0, 6).map((count) => Number(count) || 0),
    };
  } catch {
    return null;
  }
};

export default function App() {
  const {
    connect,
    disconnect,
    account: walletAccount,
    connected: isWalletConnected,
    wallets,
    signAndSubmitTransaction,
  } = useWallet();

  const accountAddress = walletAccount?.address?.toString() || null;
  const contractAddress = CONTRACT_ADDRESS;

  // Mode state: "petra" | "burner" | "sim"
  const [gameMode, setGameMode] = useState("petra");
  const [burnerAccount, setBurnerAccount] = useState(null);
  const gameModeRef = useRef(gameMode);
  gameModeRef.current = gameMode;

  // Game state
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isSolved, setIsSolved] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [correctWord, setCorrectWord] = useState("");
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState(() => loadSimulationStats() || {
    played: 0,
    won: 0,
    currentStreak: 0,
    bestStreak: 0,
    distribution: [...EMPTY_DISTRIBUTION],
  });

  // Modals
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [simulatedSolution] = useState("SMART");

  const showBanner = (text, type = "info", duration = 3500) => {
    setStatusMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => setStatusMessage(null), duration);
    }
  };

  // Initialize Burner Wallet on load
  useEffect(() => {
    const initBurner = async () => {
      const burner = getOrCreateBurnerWallet();
      setBurnerAccount(burner);

      // Auto-fund from Devnet/Testnet faucet if possible
      try {
        await aptosClient.fundAccount({
          accountAddress: burner.accountAddress,
          amount: 100_000_000,
        });
      } catch (e) {
        console.log("Faucet funding skipped or failed");
      }
    };
    initBurner();
  }, []);

  const handleConnectWallet = async () => {
    try {
      const petra = wallets?.find((w) => w.name.toLowerCase().includes("petra")) || wallets?.[0];
      if (petra) {
        await connect(petra.name);
        showBanner("Connected to " + petra.name + "!", "success");
      } else if (typeof window !== "undefined" && window.aptos) {
        await window.aptos.connect();
        showBanner("Connected to Aptos Wallet!", "success");
      } else {
        showBanner("No Aptos wallet detected. Please install Petra extension!", "error");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      showBanner("Failed to connect: " + (err.message || err), "error");
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      if (gameMode === "petra") setHasActiveGame(false);
      showBanner("Wallet disconnected", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOnChainState = useCallback(async (playerAddr) => {
    if (!playerAddr || gameMode === "sim") return;

    const requestedMode = gameMode;
    try {
      const hasGame = await aptosClient.view({
        payload: {
          function: `${contractAddress}::${MODULE_NAME}::has_game`,
          typeArguments: [],
          functionArguments: [playerAddr],
        },
      });

      if (gameModeRef.current !== requestedMode || activeAddressRef.current !== playerAddr) return;

      if (!hasGame[0]) {
        setHasActiveGame(false);
        setGuesses([]);
        setIsSolved(false);
        setIsGameOver(false);
        return;
      }

      setHasActiveGame(true);

      const status = await aptosClient.view({
        payload: {
          function: `${contractAddress}::${MODULE_NAME}::get_player_status`,
          typeArguments: [],
          functionArguments: [playerAddr],
        },
      });

      const [solved, attemptsCount, maxAttempts] = status;
      if (gameModeRef.current !== requestedMode || activeAddressRef.current !== playerAddr) return;
      setIsSolved(solved);

      const loadedGuesses = [];
      for (let i = 0; i < attemptsCount; i++) {
        const attempt = await aptosClient.view({
          payload: {
            function: `${contractAddress}::${MODULE_NAME}::get_attempt_at`,
            typeArguments: [],
            functionArguments: [playerAddr, i],
          },
        });

        const word = bytesToString(attempt[0]);
        let rawResult = attempt[1];
        let result = [];

        if (typeof rawResult === "string" && rawResult.startsWith("0x")) {
          const hex = rawResult.slice(2);
          for (let j = 0; j < hex.length; j += 2) {
            result.push(parseInt(hex.slice(j, j + 2), 16));
          }
        } else {
          result = Array.from(rawResult).map(Number);
        }

        loadedGuesses.push({ word, result });
      }

      if (gameModeRef.current !== requestedMode || activeAddressRef.current !== playerAddr) return;
      setGuesses(loadedGuesses);
      if (solved) {
        setIsGameOver(true);
      } else if (loadedGuesses.length >= maxAttempts) {
        setIsGameOver(true);
      } else {
        setIsGameOver(false);
      }

      const [gamesPlayed, gamesWon, currentStreak, bestStreak, distribution] = await aptosClient.view({
        payload: {
          function: `${contractAddress}::${MODULE_NAME}::get_player_stats`,
          typeArguments: [],
          functionArguments: [playerAddr],
        },
      });
      if (gameModeRef.current !== requestedMode || activeAddressRef.current !== playerAddr) return;
      setStatistics({
        played: Number(gamesPlayed),
        won: Number(gamesWon),
        currentStreak: Number(currentStreak),
        bestStreak: Number(bestStreak),
        distribution: Array.from(distribution).map(Number),
      });

      if (!solved && loadedGuesses.length >= Number(maxAttempts)) {
        const target = await aptosClient.view({
          payload: {
            function: `${contractAddress}::${MODULE_NAME}::get_target_word`,
            typeArguments: [],
            functionArguments: [playerAddr],
          },
        });
        setCorrectWord(bytesToString(target[0]));
      } else {
        setCorrectWord("");
      }
    } catch (err) {
      console.warn("View query:", err.message);
    }
  }, [contractAddress, gameMode]);

  // Sync state whenever the active address or mode changes
  const activeAddress = gameMode === "burner"
    ? burnerAccount?.accountAddress?.toString()
    : accountAddress;
  const activeAddressRef = useRef(activeAddress);
  activeAddressRef.current = activeAddress;

  useEffect(() => {
    setCorrectWord("");
    if (gameMode === "sim") {
      const storageKey = SIMULATION_STATS_KEY;
      setStatistics(loadSimulationStats(storageKey) || {
        played: 0,
        won: 0,
        currentStreak: 0,
        bestStreak: 0,
        distribution: [...EMPTY_DISTRIBUTION],
      });
    } else {
      setStatistics({
        played: 0,
        won: 0,
        currentStreak: 0,
        bestStreak: 0,
        distribution: [...EMPTY_DISTRIBUTION],
      });
    }
  }, [gameMode]);

  useEffect(() => {
    if (gameMode !== "sim") {
      setStatistics({
        played: 0,
        won: 0,
        currentStreak: 0,
        bestStreak: 0,
        distribution: [...EMPTY_DISTRIBUTION],
      });
    }
    if (activeAddress && gameMode !== "sim") {
      fetchOnChainState(activeAddress);
    }
  }, [activeAddress, fetchOnChainState, gameMode]);

  const recordSimulationResult = (won, attemptCount) => {
    setStatistics((previous) => {
      const distribution = [...previous.distribution];
      if (won) distribution[attemptCount - 1] += 1;
      const currentStreak = won ? previous.currentStreak + 1 : 0;
      const next = {
        played: previous.played + 1,
        won: previous.won + (won ? 1 : 0),
        currentStreak,
        bestStreak: Math.max(previous.bestStreak, currentStreak),
        distribution,
      };
      const storageKey = SIMULATION_STATS_KEY;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const evaluateSimulation = (guess, solution) => {
    const result = [0, 0, 0, 0, 0];
    const solRemaining = {};

    for (let char of solution) {
      solRemaining[char] = (solRemaining[char] || 0) + 1;
    }

    for (let i = 0; i < 5; i++) {
      if (guess[i] === solution[i]) {
        result[i] = 2;
        solRemaining[guess[i]]--;
      }
    }

    for (let i = 0; i < 5; i++) {
      if (result[i] === 0 && solRemaining[guess[i]] > 0) {
        result[i] = 1;
        solRemaining[guess[i]]--;
      }
    }

    return result;
  };

  const handleStartGame = async () => {
    if (gameMode === "petra" && !isWalletConnected) {
      await handleConnectWallet();
      return;
    }

    setIsSubmitting(true);
    try {
      if (gameMode === "sim") {
        setHasActiveGame(true);
        setGuesses([]);
        setCurrentGuess("");
        setIsSolved(false);
        setIsGameOver(false);
        setCorrectWord("");
        showBanner("New simulation game started!", "success");
      } else if (gameMode === "burner") {
        showBanner("Starting game via Burner... No popup needed!", "info");
        const transaction = await aptosClient.transaction.build.simple({
          sender: burnerAccount.accountAddress,
          data: {
            function: `${contractAddress}::${MODULE_NAME}::start_game`,
            functionArguments: [],
          },
        });
        const committedTxn = await aptosClient.signAndSubmitTransaction({
          signer: burnerAccount,
          transaction,
        });
        await aptosClient.waitForTransaction({ transactionHash: committedTxn.hash });
        showBanner("Game session created via Burner Wallet!", "success");
        await fetchOnChainState(activeAddress);
      } else {
        showBanner("Starting game on-chain... Please approve in Petra", "info");
        const response = await signAndSubmitTransaction({
          data: {
            function: `${contractAddress}::${MODULE_NAME}::start_game`,
            functionArguments: [],
          },
        });
        await aptosClient.waitForTransaction({ transactionHash: response.hash });
        showBanner("Game session created on Aptos! Ready to guess.", "success");
        await fetchOnChainState(activeAddress);
      }
    } catch (err) {
      console.error(err);
      showBanner("Failed to start game: " + (err.message || err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitGuess = async () => {
    if (gameMode === "petra" && !isWalletConnected) {
      showBanner("Please connect your wallet first", "error");
      return;
    }

    if (!hasActiveGame) {
      showBanner("Click 'Start Game' first to create your session!", "error");
      return;
    }

    if (currentGuess.length !== 5) {
      showBanner("Word must be 5 letters long", "error");
      return;
    }

    const guessWord = currentGuess.toUpperCase();
    if (!VALID_WORDS.has(guessWord)) {
      showBanner("Not in the valid word list", "error");
      return;
    }

    if (guesses.some(({ word }) => word === guessWord)) {
      showBanner("You already tried that word", "info");
      return;
    }

    if (isGameOver || isSolved) {
      showBanner("Game finished! Click reset to play again.", "info");
      return;
    }

    setIsSubmitting(true);

    try {
      if (gameMode === "sim") {
        let result;
        let solved;

        result = evaluateSimulation(guessWord, simulatedSolution);
        solved = result.every((value) => value === 2);

        const newGuesses = [...guesses, { word: guessWord, result }];
        setGuesses(newGuesses);
        setCurrentGuess("");

        if (solved) {
          setIsSolved(true);
          setIsGameOver(true);
          recordSimulationResult(true, newGuesses.length);
          showBanner("Splendid! You solved the Wordle!", "success", 5000);
        } else if (newGuesses.length >= 6) {
          setIsGameOver(true);
          const answer = simulatedSolution;
          setCorrectWord(answer);
          recordSimulationResult(false, newGuesses.length);
          showBanner(`Game Over! The words were: ${answer}`, "error", 6000);
        }
      } else {
        const guessBytes = stringToBytes(guessWord);

        if (gameMode === "burner") {
          const transaction = await aptosClient.transaction.build.simple({
            sender: burnerAccount.accountAddress,
            data: {
              function: `${contractAddress}::${MODULE_NAME}::submit_guess`,
              functionArguments: [guessBytes],
            },
          });
          const committedTxn = await aptosClient.signAndSubmitTransaction({
            signer: burnerAccount,
            transaction,
          });
          await aptosClient.waitForTransaction({ transactionHash: committedTxn.hash });
        } else {
          showBanner("Submitting guess to Aptos... Approve in Petra", "info");
          const response = await signAndSubmitTransaction({
            data: {
              function: `${contractAddress}::${MODULE_NAME}::submit_guess`,
              functionArguments: [guessBytes],
            },
          });
          await aptosClient.waitForTransaction({ transactionHash: response.hash });
        }

        setCurrentGuess("");
        await fetchOnChainState(activeAddress);
      }
    } catch (err) {
      console.error(err);
      showBanner("Transaction failed: " + (err.message || err), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGameModeChange = (nextMode) => {
    if (!["petra", "burner", "sim"].includes(nextMode)) return;

    setGameMode(nextMode);
    setHasActiveGame(false);
    setGuesses([]);
    setCurrentGuess("");
    setIsSolved(false);
    setIsGameOver(false);
    setCorrectWord("");

    if (nextMode === "sim") {
      setStatistics(loadSimulationStats() || {
        played: 0,
        won: 0,
        currentStreak: 0,
        bestStreak: 0,
        distribution: [...EMPTY_DISTRIBUTION],
      });
      showBanner("Switched to Simulation Mode", "info");
    }
    else if (nextMode === "burner") showBanner("Switched to Burner Wallet Mode (Auto-Signing)", "info");
    else showBanner("Switched to Petra Wallet Mode (Manual Approvals)", "info");
  };

  const handleKeyPress = useCallback(
    (key) => {
      if (isGameOver || isSolved || isSubmitting) return;

      if (key === "ENTER") {
        handleSubmitGuess();
      } else if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, isGameOver, isSolved, isSubmitting, handleSubmitGuess]
  );

  const letterStatuses = useMemo(() => {
    const statuses = {};
    for (const { word, result } of guesses) {
      for (let i = 0; i < 5; i++) {
        const letter = word[i];
        const status = result[i];
        const current = statuses[letter];

        if (current === undefined || status > current) {
          statuses[letter] = status;
        }
      }
    }
    return statuses;
  }, [guesses]);

  // Determine if we should show the "start game" card based on active mode
  const showStartCard = !hasActiveGame && (
    gameMode === "sim" ||
    (gameMode === "burner" && burnerAccount) ||
    (gameMode === "petra" && isWalletConnected)
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#121213] text-white">
      <Header
        account={accountAddress}
        connected={isWalletConnected}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onStartGame={handleStartGame}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenStatistics={() => setShowStatistics(true)}
        isSubmitting={isSubmitting}

        gameMode={gameMode}
        onGameModeChange={handleGameModeChange}
        isDevSimulation={gameMode === "sim"}
      />

      <main className="flex-1 flex flex-col justify-between max-w-xl w-full mx-auto px-4 py-2">
        <div className="h-10 flex items-center justify-center">
          {statusMessage && (
            <div
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg ${
                statusMessage.type === "success"
                  ? "bg-emerald-600 text-white"
                  : statusMessage.type === "error"
                  ? "bg-rose-600 text-white"
                  : "bg-neutral-800 border border-neutral-700 text-neutral-200"
              }`}
            >
              {statusMessage.type === "success" && <CheckCircle size={14} />}
              {statusMessage.type === "error" && <AlertCircle size={14} />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {showStartCard ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center max-w-sm mx-auto my-6 shadow-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {gameMode === "sim"
                ? "Start Simulation Game"
                : gameMode === "burner" ? "Start Burner Game" : "Start Live Game"}
            </h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              {gameMode === "sim"
                ? "Play locally in your browser — no wallet or gas needed."
                : gameMode === "burner"
                ? "Play on-chain using an auto-funded browser wallet. Zero Petra popups."
                : <>Your wallet needs an initialized <code className="text-emerald-400 font-mono">PlayerState</code> resource on the Aptos blockchain.</>
              }
            </p>
            <button
              onClick={handleStartGame}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
            >
              <Play size={16} fill="currentColor" />
              {isSubmitting ? "Initializing..." : "Start Game"}
            </button>
          </div>
        ) : (
          // Renders Wordle grid and keyboard directly when the session is active...
          <>
            <WordleBoard guesses={guesses} currentGuess={currentGuess} wordLength={5} />
            {isGameOver && !isSolved && correctWord && (
              <div className="text-center text-sm text-neutral-300 my-1">
                The word was <span className="font-bold text-white tracking-widest">{correctWord}</span>
              </div>
            )}
            {isGameOver && (
              <div className="text-center my-2">
                <button
                  onClick={handleStartGame}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg shadow-lg shadow-emerald-900/40 text-sm"
                >
                  Play Again
                </button>
              </div>
            )}
            <Keyboard
              onKeyPress={handleKeyPress}
              letterStatuses={letterStatuses}
              disabled={isGameOver || isSolved || isSubmitting}
            />
          </>
        )}
      </main>

      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />
      {showStatistics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowStatistics(false)}>
          <div className="w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Statistics</h2>
              <button onClick={() => setShowStatistics(false)} className="text-xl text-neutral-400" aria-label="Close statistics">×</button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                [statistics.played, "Played"],
                [statistics.played ? Math.round((statistics.won / statistics.played) * 100) : 0, "Win %"],
                [statistics.currentStreak, "Current"],
                [statistics.bestStreak, "Best"],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-[10px] text-neutral-400">{label}</div>
                </div>
              ))}
            </div>
            <h3 className="mt-5 mb-2 text-sm font-bold">Guess Distribution</h3>
            {statistics.distribution.map((count, index) => (
              <div key={index} className="mb-1 grid grid-cols-[1rem_1fr] items-center gap-2 text-xs">
                <span>{index + 1}</span>
                <div className="bg-neutral-700 text-right pr-1" style={{ width: `${Math.max(count ? 12 : 5, count ? (count / Math.max(...statistics.distribution, 1)) * 100 : 5)}%` }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
