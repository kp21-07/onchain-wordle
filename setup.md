# Wordle Setup Guide

This guide explains how to run the project from a computer with no development tools installed. The fastest route is Simulation mode; Petra or Burner mode requires deploying or configuring access to the Aptos Move contract.

## 1. What you need

For the browser frontend:

- Node.js 18 or newer
- npm (included with Node.js)
- Git
- A modern browser

For on-chain play:

- Aptos CLI
- An Aptos wallet, such as Petra, for Petra mode
- A funded Aptos account on the selected network
- A deployed copy of the `wordle` Move module

You can check which tools are installed with:

```bash
node --version
npm --version
git --version
aptos --version
```

## 2. Install the prerequisites

### macOS

Install Homebrew if it is not already available:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install Git and Node.js:

```bash
brew install git node
```

Install the Aptos CLI by following the instructions for macOS in the Aptos documentation for your CPU architecture. Confirm that `aptos` is available in your terminal:

```bash
aptos --version
```

### Ubuntu or Debian Linux

Install Git and Node.js from the package manager:

```bash
sudo apt update
sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install the Aptos CLI using the Aptos installation instructions for Linux and then verify it:

```bash
aptos --version
```

### Windows

Install Git for Windows, Node.js 20 LTS, and Aptos CLI for Windows. Run repository and deployment commands from Git Bash, WSL, or PowerShell. Ensure that both Node.js and Aptos CLI directories are added to `PATH`.

Verify them in the same terminal used for the project:

```powershell
node --version
npm --version
git --version
aptos --version
```

## 3. Download the project

```bash
git clone <https://github.com/kp21-07/onchain-wordle>
cd onchain-wordle
```

## 4. Install the node modules

From the project root:

```bash
cd frontend
npm install
```

## 5. Run in Simulation mode

Simulation mode needs no contract deployment, Aptos account, Petra wallet, or private key.

Start the frontend:

```bash
npm run dev
```

Open the address printed by Vite, normally:

```text
http://localhost:3000
```

In the header:

1. Select **Simulation** from the mode menu.
2. Start the game.
3. Enter valid five-letter words and submit them with Enter or the on-screen keyboard.

Simulation statistics are stored in the browser's local storage. Clearing site data removes those statistics and resets the simulation state.

## 6. Configure the frontend for an Aptos deployment

The frontend reads two optional environment variables from `frontend/.env.local`:

```dotenv
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_MODULE_ADDRESS
VITE_APTOS_NETWORK=devnet
```

You can create the file from the example:

From the project root:

```bash
cp frontend/.env.example frontend/.env.local
```

On Windows, create the same file manually in the `frontend` directory.

The supported network values are `devnet`, `testnet`, and `mainnet`. Devnet is recommended for development. Restart the frontend after changing this file.

> **NOTE**: Do not commit `.env.local` or private keys.

## 7. Create and fund an Aptos account for deployment

The deployment script uses an Aptos CLI profile. Create a Devnet profile from the `contracts` directory:

```bash
cd contracts
aptos init --profile wordle-devnet --network devnet
```

The Aptos CLI prints instructions and an account address. Devnet accounts normally receive test funds during this setup when the faucet is available. Confirm that the CLI can see the profile:

```bash
aptos config show-profiles --profile wordle-devnet
```

## 8. Deploy and initialize the contract

From the project root:

```bash
cd contracts
./deploy.sh --new-profile wordle-devnet --initialize --network devnet
```

The deployment script:

1. Creates or selects the named Aptos CLI profile.
2. Publishes `wordle.move` at the profile's account address.
3. Initializes `WordleConfig` and creates the answer pool when `--initialize` is used.
4. Writes the module address and network into `frontend/.env.local`.

Initialization should be run once for a new module address. Do not rerun initialization on an existing deployed module unless the account intentionally requires a fresh configuration.

If the shell reports a backward-incompatible module error, deploy to a new profile and address rather than attempting to overwrite existing resources with an incompatible ABI:

```bash
./deploy.sh --new-profile wordle-devnet-v2 --initialize --network devnet
```

## 9. Connect Petra for live play

1. Install the Petra browser extension.
2. Open its settings and select the same network used for deployment, normally Devnet.
3. Create or import an Aptos account and fund it sufficiently for gas.
4. Start the frontend and select **Petra** in the header.
5. Select **Connect**, approve the Petra connection, and approve the game and guess transactions when requested.

The deployed contract address must belong to the network selected in Petra. Petra is intended for live on-chain play; local development transactions can incur gas fees even on Devnet.

## 10. Use Burner mode

Select **Burner** in the header. Burner mode:

- Generates and stores an Ed25519 account in browser local storage.
- Signs transactions locally without a Petra approval popup.
- Attempts to fund the Devnet account automatically.

The burner key is stored under `wordle_burner_key`. Do not use this account for real funds or production assets. Clearing this site's browser storage deletes or makes the old burner key inaccessible and creates a new account with a new address. If the burner account lacks Devnet APT, fund it manually using a Devnet faucet before starting a game.

## 11. Verify the installation

Compile the Move package with development addresses:

```bash
cd contracts
aptos move compile --dev
```

Run the contract tests:

```bash
aptos move test --dev
```

Create the frontend production build:

```bash
cd ../frontend
npm run build
```

The frontend build output is written to `frontend/dist/`.

## 12. Deployment script options

Run this command from the `contracts` directory:

```bash
./deploy.sh --help
```

Available options:

| Option | Purpose |
|---|---|
| `--initialize` | Calls `wordle::initialize` after publishing. |
| `--new-profile NAME` | Creates or uses a named CLI profile and deploys to its account address. |
| `--remove-profile NAME` | Removes an old local CLI profile after a successful deployment. |
| `--network devnet\|testnet\|mainnet` | Selects the deployment network. |
| `-h`, `--help` | Displays usage. |

The profile can also be selected with an environment variable:

```bash
APTOS_PROFILE=wordle-devnet ./deploy.sh --initialize --network devnet
```

Removing a profile deletes only its local private key configuration. It does not delete its account or Move module from Aptos. Back up the profile before deleting it if the account must be recovered later.

## 13. Common problems

### `aptos: command not found`

Install or restart the Aptos CLI setup and ensure the CLI installation directory is included in `PATH`.

### `npm: command not found`

Install Node.js. npm is included with supported Node.js distributions.

### `Permission denied: ./deploy.sh`

```bash
chmod +x deploy.sh
./deploy.sh --initialize
```

### No Petra wallet appears

Install or enable the Petra browser extension, refresh the page, and confirm the browser extension is allowed to run on localhost.

### Frontend still uses the old contract address

Stop Vite with Ctrl+C, update `frontend/.env.local`, and start it again:

```bash
cd ../frontend
npm run dev
```

### `BACKWARD_INCOMPATIBLE_MODULE_UPDATE`

Deploy with a new CLI profile and module address. Existing Move resources and module interfaces cannot safely be replaced in place when their layout or ABI is incompatible.

### The game cannot start or submit guesses

Check that:

- The frontend contract address matches the deployed module address.
- The frontend and wallet are on the same network.
- The contract was initialized.
- The account has enough APT to pay transaction gas.
- The browser wallet connection has been approved.

## 14. Stop the frontend

In the terminal running Vite, press Ctrl+C.
