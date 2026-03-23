"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";

interface ConnectButtonProps {
  large?: boolean;
}

export function ConnectButton({ large }: ConnectButtonProps) {
  // Guard against kit not being ready on first render (dynamic ssr:false component)
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
        className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-slate-200 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200"
      >
        {/* Connected indicator */}
        <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot flex-shrink-0" />
        <span className="font-mono">{displayName}</span>
      </button>
    );
  }

  if (large) {
    return (
      <button
        onClick={() => openConnect?.()}
        className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-violet-900/40 hover:shadow-violet-800/60 hover:-translate-y-0.5 active:translate-y-0 text-base"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Connect Wallet
        <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </button>
    );
  }

  return (
    <button
      onClick={() => openConnect?.()}
      className="group relative flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-md shadow-violet-900/30 hover:shadow-violet-800/50"
    >
      Connect Wallet
      <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
}
