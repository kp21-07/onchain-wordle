import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export function getOrCreateBurnerWallet() {
  const BURNER_KEY = "wordle_burner_key";
  let privateKeyHex = localStorage.getItem(BURNER_KEY);

  if (!privateKeyHex) {
    // Generate a fresh account if one doesn't exist
    const newAccount = Account.generate();
    privateKeyHex = newAccount.privateKey.toString();
    localStorage.setItem(BURNER_KEY, privateKeyHex);
  }

  // Instantiate the Aptos Account object from the saved private key
  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  return Account.fromPrivateKey({ privateKey });
}
