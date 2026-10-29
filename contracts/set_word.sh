#!/bin/bash
# Usage: ./set_word.sh GAMER
# Changes the on-chain Wordle secret word using the admin key in .aptos/config.yaml

set -e

WORD="${1:-}"

if [ -z "$WORD" ]; then
  echo "Usage: ./set_word.sh <5-LETTER-WORD>"
  echo "Example: ./set_word.sh GAMER"
  exit 1
fi

if [ ${#WORD} -ne 5 ]; then
  echo "Error: Word must be exactly 5 letters. Got '${WORD}' (${#WORD} letters)"
  exit 1
fi

# Convert to uppercase
WORD=$(echo "$WORD" | tr '[:lower:]' '[:upper:]')

echo "Setting Wordle solution to: $WORD"

cd "$(dirname "$0")"

aptos move run \
  --function-id 'default::wordle::set_solution' \
  --args "string:${WORD}" \
  --assume-yes

echo ""
echo "✅ Solution updated to: $WORD"
echo "Reload the DApp to use the new word."
