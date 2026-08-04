"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Loader2, Pencil, QrCode } from "lucide-react";
import { validateWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

interface WalletOption {
  id: string;
  name: string;
  type: "evm" | "cosmos";
  detect: () => boolean;
  connect: () => Promise<string>;
}

declare global {
  interface Window {
    ethereum?: any;
    keplr?: any;
    leap?: any;
  }
}

const KII_CHAIN_ID = "kiichain"; // replace with the real chain-id string for Keplr/Leap suggestChain calls

const options: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    type: "evm",
    detect: () => typeof window !== "undefined" && !!window.ethereum,
    connect: async () => {
      const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      return accounts[0];
    },
  },
  {
    id: "keplr",
    name: "Keplr",
    type: "cosmos",
    detect: () => typeof window !== "undefined" && !!window.keplr,
    connect: async () => {
      await window.keplr.enable(KII_CHAIN_ID);
      const offlineSigner = window.keplr.getOfflineSigner(KII_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      return accounts[0].address;
    },
  },
  {
    id: "leap",
    name: "Leap",
    type: "cosmos",
    detect: () => typeof window !== "undefined" && !!window.leap,
    connect: async () => {
      await window.leap.enable(KII_CHAIN_ID);
      const offlineSigner = window.leap.getOfflineSigner(KII_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      return accounts[0].address;
    },
  },
];

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

async function connectWalletConnect(): Promise<string> {
  if (!walletConnectProjectId) {
    throw new Error("WalletConnect isn't configured (missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID).");
  }
  // Loaded dynamically: it's a large, browser-only client with its own QR modal UI,
  // so it's kept out of the initial bundle and off the server render path.
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const provider = await EthereumProvider.init({
    projectId: walletConnectProjectId,
    chains: [1],
    optionalChains: [1, 137, 8453],
    showQrModal: true,
    metadata: {
      name: "KiiChain Role Verification Portal",
      description: "Verify your Discord role and submit your wallet address for reward eligibility.",
      url: typeof window !== "undefined" ? window.location.origin : "https://roles.kiichain.io",
      icons: [],
    },
  });
  await provider.connect();
  const accounts = provider.accounts;
  await provider.disconnect().catch(() => {}); // we only need the address, not a live session
  if (!accounts?.[0]) throw new Error("No account returned by WalletConnect.");
  return accounts[0];
}

interface Props {
  onConnected: (address: string) => void;
}

export default function WalletConnectPanel({ onConnected }: Props) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(opt: WalletOption) {
    setError(null);
    if (!opt.detect()) {
      setError(`${opt.name} extension not detected. Install it, or paste your address manually below.`);
      return;
    }
    setConnecting(opt.id);
    try {
      const address = await opt.connect();
      const valid = validateWallet(address);
      if (!valid) {
        setError("Connected, but the returned address didn't validate. Try pasting it manually.");
        return;
      }
      onConnected(valid.address);
    } catch (err: any) {
      setError(err?.message || "Connection was rejected or failed.");
    } finally {
      setConnecting(null);
    }
  }

  async function handleWalletConnect() {
    setError(null);
    setConnecting("walletconnect");
    try {
      const address = await connectWalletConnect();
      const valid = validateWallet(address);
      if (!valid) {
        setError("Connected, but the returned address didn't validate. Try pasting it manually.");
        return;
      }
      onConnected(valid.address);
    } catch (err: any) {
      setError(err?.message || "WalletConnect connection was rejected or failed.");
    } finally {
      setConnecting(null);
    }
  }

  function handleManualSubmit() {
    const valid = validateWallet(manualValue);
    if (!valid) {
      setError("That doesn't look like a valid EVM (0x…) or Cosmos (kii1…) address.");
      return;
    }
    setError(null);
    onConnected(valid.address);
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleConnect(opt)}
            disabled={connecting !== null}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl2 border border-line bg-white/[0.02] px-3 py-5",
              "transition-all duration-200 hover:border-violet-soft/40 hover:bg-white/[0.04]",
              "disabled:opacity-50"
            )}
          >
            {connecting === opt.id ? (
              <Loader2 className="h-5 w-5 animate-spin text-violet-soft" />
            ) : (
              <Wallet className="h-5 w-5 text-violet-soft" strokeWidth={1.8} />
            )}
            <span className="font-display text-[13px] font-medium text-mist">{opt.name}</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-mist/40">{opt.type}</span>
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleWalletConnect}
          disabled={connecting !== null || !walletConnectProjectId}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl2 border border-line bg-white/[0.02] px-3 py-5",
            "transition-all duration-200 hover:border-violet-soft/40 hover:bg-white/[0.04]",
            "disabled:opacity-50"
          )}
          title={!walletConnectProjectId ? "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set" : undefined}
        >
          {connecting === "walletconnect" ? (
            <Loader2 className="h-5 w-5 animate-spin text-violet-soft" />
          ) : (
            <QrCode className="h-5 w-5 text-violet-soft" strokeWidth={1.8} />
          )}
          <span className="font-display text-[13px] font-medium text-mist">WalletConnect</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-mist/40">evm</span>
        </motion.button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => setManualMode((v) => !v)}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-mist/45 hover:text-violet-soft"
        >
          <Pencil className="h-3 w-3" />
          {manualMode ? "Hide manual entry" : "Paste address manually instead"}
        </button>
      </div>

      {manualMode && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
          <div className="flex gap-2">
            <input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="0x… or kii1…"
              className="flex-1 rounded-lg border border-line bg-white/[0.03] px-4 py-3 font-mono text-sm text-mist placeholder:text-mist/30 focus:border-violet-soft/50 focus:outline-none"
            />
            <button onClick={handleManualSubmit} className="btn-secondary shrink-0 px-5">
              Use address
            </button>
          </div>
        </motion.div>
      )}

      {error && <p className="mt-4 text-center text-[13px] text-red-400/90">{error}</p>}
    </div>
  );
}
