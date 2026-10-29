# On-Chain Wordle (Track 3) — Aptos Blockchain

A decentralized, tamper-proof implementation of Wordle built on the **Aptos Blockchain** with Move smart contracts and a modern interactive React frontend.

---

## 📖 1. Understanding Wordle / Qwordle On-Chain & Use Cases

### Why Put Wordle On-Chain?
In traditional web-based Wordle games, the secret word or the validation algorithm is executed client-side in JavaScript or on a centralized backend server:
- **Client-side exposure:** Anyone can open the browser developer tools, inspect `localStorage` or JavaScript state, and immediately uncover the solution.
- **Centralized authority:** High-score leaderboards and tournament prizes can be fabricated or manipulated by malicious clients or dishonest server operators.
- **Fair Play & Verifiability:** On-chain Wordle provides **cryptographic provability** and **immutable audit trails**. Every guess, timestamp, and evaluation is recorded on-chain, eliminating disputes and creating a trustless tournament ground.

### Key Use Cases
1. **Competitive Daily Tournaments & Wagering:** Players can deposit small buy-ins (e.g. 0.1 APT) into an on-chain prize pool. The winner(s) who solve the word in the fewest guesses receive automatic, smart contract payouts.
2. **Proof-of-Wordle NFT / On-Chain Badges:** Completing streak milestones (e.g., 7 days in a row) mints dynamic Aptos Digital Assets (NFTs) directly to the player's wallet.
3. **Qwordle / Quantum Wordle Expansion:** Storing entangled words or probabilistic states on-chain where guesses collapse state upon validation.
4. **Educational Move Demonstration:** Serves as a canonical example of Move resources, two-pass vector matching algorithms, account ownership patterns, and zero-trust validation.

---

## 🏗️ 2. Architecture & Smart Contract Design

### Directory Structure
```
wordle_web3/
├── contracts/                  # Aptos Move package
│   ├── Move.toml               # Move dependencies & named addresses
│   ├── sources/
│   │   └── wordle.move         # Core Wordle module logic
│   └── tests/
│       └── wordle_tests.move   # Unit tests suite (aptos move test)
├── frontend/                   # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/         # WordleBoard, Keyboard, Header, Modals
│   │   ├── utils/              # Aptos client, encoding utilities
│   │   ├── App.jsx             # Main game logic & wallet connection
│   │   └── main.jsx
│   └── package.json
└── README.md                   # Full documentation & guide
```

### Move Resources
- **`WordleConfig`**: Stored at `@wordle_addr`.
  - Holds `admin: address`
  - Holds `solution: vector<u8>` (5 uppercase ASCII bytes)
  - Holds `is_active: bool`
- **`PlayerState`**: Stored under each player's account address (`signer`).
  - Holds `attempts: vector<GuessResult>`
  - Holds `is_solved: bool`
  - Holds `max_attempts: u64` (default: 6)

### Evaluation Logic (Two-Pass Matcher)
Move evaluates guesses against the stored solution using a 2-pass algorithm to handle duplicate letters accurately:
- **`MATCH_EXACT = 2` (Green):** Letter matches exact position.
- **`MATCH_PARTIAL = 1` (Yellow):** Letter exists elsewhere in the remaining unallocated solution letters.
- **`MATCH_NONE = 0` (Gray):** Letter is absent or already matched.

---

## 🚀 3. Getting Started & Setup

### Prerequisites
- [Aptos CLI](https://aptos.dev/tools/aptos-cli/) (`aptos 9.6.0+`)
- Node.js (`v18+` or `v23+`) and npm

### Smart Contract Verification
Run the unit tests:
```bash
cd contracts
aptos move test
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
The frontend comes equipped with both:
- **Local Simulation Mode:** Instant game loop testing with zero gas.
- **Live Aptos Network Mode:** Direct RPC calls to your deployed contract on Devnet or Testnet.
