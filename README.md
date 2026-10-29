# Aptos On-Chain Wordle

A decentralized implementation of Wordle using an Aptos Move smart contract and a React frontend. The contract records each player session, evaluates guesses, selects randomized answers, and maintains player statistics on-chain.

## Features

- Six attempts to guess a five-letter word
- On-chain two-pass letter matching with duplicate-letter handling
- Aptos randomness for answer selection
- Petra, burner-wallet, and local simulation modes
- Persistent on-chain player statistics
- Guess distribution, win percentage, and current/best streaks
- Correct answer reveal after a failed game
- Valid-word validation in the frontend

## Architecture

### Smart contract

The Move package is located in `contracts/`.

- `sources/wordle.move` contains the game module.
- `Move.toml` defines the package and Aptos Framework dependency.
- `tests/wordle_tests.move` contains Move tests.

`WordleConfig` is stored at the package address and contains the administrative address, randomized answer pool, and active state. `PlayerState` is stored under each player's account and contains attempts, the current target, game status, and cumulative statistics.

Guess feedback uses these values:

| Value | Meaning |
|---:|---|
| 0 | Letter is absent |
| 1 | Letter is present in a different position |
| 2 | Letter is present in the correct position |

### Frontend

The frontend is a React and Vite application located in `frontend/`. It communicates with Aptos through the TypeScript SDK and wallet adapter.

- Petra mode uses the player's connected wallet.
- Burner mode uses a local development wallet.
- Simulation mode runs entirely in the browser and requires no transaction.
- QWordle is currently available only as a frontend simulation while its Move contract is developed.

## Prerequisites

- Aptos CLI
- Node.js 18 or newer
- npm
- Petra or another Aptos wallet for live Petra mode

Verify the required tools:

```bash
aptos --version
node --version
npm --version
```

## Local Development

Install frontend dependencies and start Vite:

```bash
cd frontend
npm install
npm run dev
```

The development server is configured to run at `http://localhost:3000`.

Create the local frontend environment configuration from the committed template:

```bash
cd frontend
cp .env.example .env.local
```

Set the contract address and network after deployment:

```dotenv
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_APTOS_NETWORK=devnet
```

`frontend/.env.local` is local configuration and must not be committed.

## Move Contract Development

Compile the contract:

```bash
cd contracts
aptos move compile --named-addresses wordle_addr=0xcafe
```

Run Move tests:

```bash
cd contracts
aptos move test
```

## Deployment with deploy.sh

Run the deployment script from the `contracts` directory:

```bash
cd contracts
./deploy.sh
```

The script performs the following operations:

1. Uses the Aptos CLI profile named `default`, unless `APTOS_PROFILE` is set or another profile option is provided.
2. Creates the selected profile automatically if it does not exist.
3. Reads the account address belonging to the profile.
4. Publishes the Move package using that account as the `wordle_addr` named address.
5. Optionally initializes `WordleConfig`.
6. Writes the deployed address and network to `frontend/.env.local`.
7. Optionally removes a previous local CLI profile after deployment succeeds.
8. Instructs the developer to restart the frontend development server.

### First deployment and initialization

Initialize the deployed contract the first time it is published:

```bash
cd contracts
./deploy.sh --initialize
```

Initialization creates the contract configuration and answer pool. It should only be run once for a newly deployed address and package.

### Use an existing named profile

```bash
cd contracts
APTOS_PROFILE=wordle-devnet ./deploy.sh --initialize
```

Or pass the profile as a new-profile deployment:

```bash
cd contracts
./deploy.sh --new-profile wordle-devnet-v2 --initialize
```

### Deploy to a fresh account address

Deploying to a fresh profile creates a new account address and module address:

```bash
cd contracts
./deploy.sh --new-profile wordle-devnet-v2 --initialize
```

A fresh address is required when an existing deployed module is not backward-compatible with the new resource layout, entry-function signature, or public API.

### Remove an old local profile

After successfully publishing with a new profile, the previous profile can be removed locally:

```bash
cd contracts
./deploy.sh \
  --new-profile wordle-devnet-v2 \
  --initialize \
  --remove-profile default
```

This deletes the old profile and private key from the local Aptos CLI configuration. It does not delete the old account or module from the Aptos network. Ensure the old profile is no longer needed before removing it.

### Select a network

The default deployment network is `devnet`:

```bash
cd contracts
./deploy.sh --initialize --network devnet
./deploy.sh --initialize --network testnet
./deploy.sh --initialize --network mainnet
```

The script writes the selected network to `VITE_APTOS_NETWORK` in `frontend/.env.local`.

### Deployment options

| Option | Description |
|---|---|
| `--initialize` | Calls `wordle::initialize` after publishing |
| `--new-profile NAME` | Creates or uses a named Aptos CLI profile and deploys to its address |
| `--remove-profile NAME` | Removes the named local profile after successful deployment |
| `--network devnet\|testnet\|mainnet` | Selects the Aptos network |
| `-h`, `--help` | Displays deployment usage |

Environment variables can also select defaults:

```bash
APTOS_PROFILE=wordle-devnet ./deploy.sh --initialize --network devnet
```

## Upgrade Compatibility

Aptos Move modules cannot be upgraded in place if the update changes resource layouts, changes public entry-function parameters, or removes public functions that existing modules depend on. Such upgrades may fail with `BACKWARD_INCOMPATIBLE_MODULE_UPDATE`.

Use a fresh profile and account when making incompatible contract changes:

```bash
cd contracts
./deploy.sh --new-profile wordle-v2 --initialize
```

After deployment, the script updates the frontend environment file with the new module address.

## Production Build

Create a production frontend build:

```bash
cd frontend
npm run build
```

Generated files are placed in `frontend/dist/`.

## Security Notes

- Never commit `frontend/.env.local` or private keys.
- Profile configuration under `.aptos/` is ignored by Git.
- Frontend word validation improves user experience but should not replace contract validation.
- Random answer selection and game settlement must remain verifiable in the Move contract.
