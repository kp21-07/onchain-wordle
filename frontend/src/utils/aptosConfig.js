import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Change this to your deployed module address on Devnet/Testnet
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0xd3e074ba97db456b58ff10e543becf72f269352220c43a131ec9cd52d5f61ce5";

export const MODULE_NAME = "wordle";

const configuredNetwork = (import.meta.env.VITE_APTOS_NETWORK || "devnet").toUpperCase();
export const NETWORK = Network[configuredNetwork] || Network.DEVNET;

const config = new AptosConfig({ network: NETWORK });
export const aptosClient = new Aptos(config);

/**
 * Format bytes to string
 */
export function bytesToString(bytes) {
  if (typeof bytes === "string") {
    // If it's a hex string like "0x534d415254"
    if (bytes.startsWith("0x")) {
      const hex = bytes.slice(2);
      let str = "";
      for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return str;
    }
    return bytes;
  }
  if (Array.isArray(bytes)) {
    return String.fromCharCode(...bytes);
  }
  return "";
}

/**
 * Convert string (e.g. "SMART") to byte array or hex string for Aptos Move
 */
export function stringToBytes(str) {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(str.toUpperCase()));
}
