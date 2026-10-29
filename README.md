# Aptos On-Chain Wordle

A Wordle game built with React and an Aptos Move smart contract. Players submit five-letter guesses, receive on-chain duplicate-aware tile feedback, and have their game statistics recorded on Aptos.

## Features

- Six guesses per game
- Duplicate-letter-aware tile matching
- On-chain game state and player statistics
- Aptos random answer selection
- Petra, Burner, and browser-only Simulation modes
- Statistics for played games, wins, streaks, and guess distribution

## Requirements

- Node.js 18 or newer
- npm
- Aptos CLI
- Petra or another Aptos browser wallet for live play

A complete first-time installation guide is available in [setup.md](setup.md).

## Quick Start

### Simulation mode

No wallet or contract deployment is required.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`, select **Simulation**, and start a game.

### Live on-chain mode

1. Configure an Aptos CLI profile.
2. Deploy and initialize the contract.
3. Add the deployed module address to `frontend/.env.local`.
4. Start the frontend and connect a wallet.

```bash
cp frontend/.env.example frontend/.env.local
cd contracts
aptos init --profile wordle-devnet --network devnet
./deploy.sh --new-profile wordle-devnet --initialize --network devnet
cd ../frontend
npm install
npm run dev
```

The deployment script writes the contract address and network to `frontend/.env.local`.

See [setup.md](setup.md) for prerequisites, platform-specific installation, Burner and Petra configuration, troubleshooting, and deployment options.

## Project Structure

```text
.
├── contracts/
│   ├── sources/wordle.move       Move contract
│   ├── tests/wordle_tests.move   Contract unit tests
│   ├── deploy.sh                 Contract deployment script
│   └── set_word.sh               Answer configuration helper
├── frontend/
│   ├── src/
│   │   ├── components/           Game UI components
│   │   └── utils/                Aptos and wallet utilities
│   ├── .env.example              Frontend environment template
│   └── package.json
├── documentation/wordle/         Wordle technical documentation
├── README.md
└── setup.md                      Full setup and deployment guide
```

## Contract

The Move package is in `contracts/` and uses the named address `wordle_addr`. It defines:

- Randomized answer selection
- Guess validation and duplicate-aware feedback
- Player game state stored at each player address
- Win/loss settlement and player statistics
- Read-only views for frontend state

Compile and test locally:

```bash
cd contracts
aptos move compile --dev
aptos move test --dev
```

## Frontend Modes

| Mode | Behavior |
|---|---|
| Petra | Connects an Aptos wallet and submits signed transactions to the contract. |
| Burner | Uses a locally generated browser wallet and signs transactions without Petra prompts. |
| Simulation | Runs locally in the browser and does not require a wallet or contract transaction. |

Simulation statistics are stored in browser local storage. On-chain modes use resources stored at the connected Aptos account.

## Deployment

```bash
cd contracts
./deploy.sh --initialize --network devnet
```

Common deployment options:

```bash
./deploy.sh --new-profile wordle-devnet --initialize --network devnet
./deploy.sh --network testnet --initialize
./deploy.sh --help
```

The script publishes the package, optionally initializes `WordleConfig`, and updates `frontend/.env.local`.

## Production Build

```bash
cd frontend
npm run build
npm run preview
```

The production files are generated in `frontend/dist/`.

## Documentation

Additional Wordle technical documentation is available in [documentation/wordle/](documentation/wordle/) and the rendered PDF is at [documentation/wordle/wordle.pdf](documentation/wordle/wordle.pdf).
