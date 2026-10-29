#!/usr/bin/env bash
set -euo pipefail

PROFILE="${APTOS_PROFILE:-default}"
NEW_PROFILE=""
REMOVE_PROFILE=""
NETWORK="devnet"
INITIALIZE=false

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [--initialize]
               [--new-profile NAME] [--remove-profile NAME]
               [--network devnet|testnet|mainnet]

Publishes the Move package, writes the deployed address to frontend/.env.local,
and optionally initializes WordleConfig on its first deployment.

--new-profile NAME creates a new Aptos CLI account/profile and deploys to its
new address. This is required when the existing module ABI cannot be upgraded.

--remove-profile NAME removes only that profile from the local Aptos CLI config
after the new deployment succeeds. Aptos does not allow on-chain modules to be
deleted, so old modules/resources may remain on-chain and the account address
will still be visible in explorers. Removing the profile also discards its local
private key, so make sure the old account is no longer needed.

Existing deployed modules cannot change resource layouts, function signatures,
or remove public functions in place.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --initialize)
      INITIALIZE=true
      shift
      ;;
    --new-profile)
      [[ $# -ge 2 ]] || { echo "Missing value for --new-profile"; usage; exit 1; }
      NEW_PROFILE="$2"
      PROFILE="$NEW_PROFILE"
      shift 2
      ;;
    --remove-profile)
      [[ $# -ge 2 ]] || { echo "Missing value for --remove-profile"; usage; exit 1; }
      REMOVE_PROFILE="$2"
      shift 2
      ;;
    --network)
      [[ $# -ge 2 ]] || { echo "Missing value for --network"; usage; exit 1; }
      NETWORK="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -n "$REMOVE_PROFILE" && "$REMOVE_PROFILE" == "$PROFILE" ]]; then
  echo "Error: --remove-profile cannot identify the profile being used for deployment."
  exit 1
fi

case "$NETWORK" in
  devnet|testnet|mainnet) ;;
  *) echo "Error: --network must be devnet, testnet, or mainnet."; exit 1 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_DIR/frontend/.env.local"

cd "$SCRIPT_DIR"

PROFILE_OUTPUT="$(aptos config show-profiles --profile "$PROFILE" 2>/dev/null || true)"
MODULE_ADDRESS="$(printf '%s' "$PROFILE_OUTPUT" | sed -n 's/.*"account": "\([^",]*\)".*/\1/p' | head -n 1)"

if [[ -z "$MODULE_ADDRESS" ]]; then
  echo "Creating Aptos profile '$PROFILE' on $NETWORK..."
  aptos init \
    --profile "$PROFILE" \
    --network "$NETWORK" \
    --assume-yes

  PROFILE_OUTPUT="$(aptos config show-profiles --profile "$PROFILE" 2>/dev/null || true)"
  MODULE_ADDRESS="$(printf '%s' "$PROFILE_OUTPUT" | sed -n 's/.*"account": "\([^",]*\)".*/\1/p' | head -n 1)"
fi

if [[ "$MODULE_ADDRESS" != 0x* ]]; then
  MODULE_ADDRESS="0x$MODULE_ADDRESS"
fi

if [[ ! "$MODULE_ADDRESS" =~ ^0x[0-9a-fA-F]+$ ]]; then
  echo "Could not determine the account address for Aptos profile '$PROFILE'."
  exit 1
fi

MODULE_ADDRESS="0x$(printf '%s' "$MODULE_ADDRESS" | sed 's/^0x//' | tr '[:upper:]' '[:lower:]')"
echo "Publishing $MODULE_ADDRESS from profile '$PROFILE'..."

if ! aptos move publish \
  --profile "$PROFILE" \
  --named-addresses "wordle_addr=$MODULE_ADDRESS" \
  --assume-yes
then
  cat <<EOF

Publish failed. If Aptos reports BACKWARD_INCOMPATIBLE_MODULE_UPDATE:
the deployed module at $MODULE_ADDRESS is an older ABI and its resources or
public functions cannot be changed in place. Do one of the following:

  - Deploy to a fresh profile/account for this ABI:
      aptos init --profile wordle-devnet --network devnet
      APTOS_PROFILE=wordle-devnet ./deploy.sh --initialize

  - Restore ABI compatibility, then upgrade and initialize/configure manually.

No frontend environment file was changed because publishing did not succeed.
EOF
  exit 1
fi

if [[ "$INITIALIZE" == true ]]; then
  echo "Initializing Wordle..."
  aptos move run \
    --profile "$PROFILE" \
    --function-id "$MODULE_ADDRESS::wordle::initialize" \
    --assume-yes
fi

printf 'VITE_CONTRACT_ADDRESS=%s\nVITE_APTOS_NETWORK=%s\n' "$MODULE_ADDRESS" "$NETWORK" > "$ENV_FILE"
echo "Frontend configuration updated: $ENV_FILE"

if [[ -n "$REMOVE_PROFILE" ]]; then
  if aptos config show-profiles --profile "$REMOVE_PROFILE" >/dev/null 2>&1; then
    echo "Removing local Aptos profile '$REMOVE_PROFILE'..."
    printf 'y\n' | aptos config delete-profile --profile "$REMOVE_PROFILE"
  else
    echo "Warning: local profile '$REMOVE_PROFILE' was not found; nothing to remove."
  fi
fi

echo "Restart npm run dev to load the new address."
