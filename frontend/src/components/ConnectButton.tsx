"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";

interface ConnectButtonProps {
  large?: boolean;
}

export function ConnectButton({ large }: ConnectButtonProps) {
  const kit = useInterwovenKit();
  const address = kit?.address;
  const username = kit?.username;
  const openConnect = kit?.openConnect;
  const openWallet = kit?.openWallet;

  if (address) {
    const displayName = username
      ? `${username}.init`
      : `${address.slice(0, 8)}...${address.slice(-4)}`;

    return (
      <button
        onClick={() => openWallet?.()}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-violet-500/30 text-slate-200 text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot flex-shrink-0" />
        <span className="font-mono text-xs">{displayName}</span>
      </button>
    );
  }

  if (large) {
    return (
      <div className="flex flex-col items-center gap-2.5">
        <button
          onClick={() => openConnect?.()}
          className="group relative inline-flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-7 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-violet-900/40 hover:shadow-violet-800/50 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Connect Wallet
          <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
        <p className="text-xs text-slate-600">
          Use <span className="text-slate-400">Keplr</span> or <span className="text-slate-400">Leap</span> — MetaMask is EVM only
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => openConnect?.()}
      className="group relative flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 shadow-md shadow-violet-900/30"
    >
      Connect Wallet
      <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
}
