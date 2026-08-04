import { getAddress } from "ethers";

export type WalletType = "evm" | "cosmos";

const COSMOS_BECH32 = /^(kii|cosmos|osmo|akash|juno)[a-z0-9]{38,44}$/;

/**
 * Detects wallet type and validates its format.
 * Returns the normalized (checksummed for EVM) address, or null if invalid.
 */
export function validateWallet(raw: string): { address: string; type: WalletType } | null {
  const address = raw.trim();

  // EVM: 0x + 40 hex chars, checksum-validated
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    try {
      return { address: getAddress(address), type: "evm" };
    } catch {
      return null;
    }
  }

  // Cosmos-style bech32 (kii..., cosmos..., etc.)
  if (COSMOS_BECH32.test(address)) {
    return { address, type: "cosmos" };
  }

  return null;
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
