"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { clsx } from "clsx";

interface ConnectButtonProps {
  large?: boolean;
}

export function ConnectButton({ large }: ConnectButtonProps) {
  const { address, username, openConnect, openWallet } = useInterwovenKit();

  if (address) {
    const displayName = username ? `${username}.init` : `${address.slice(0, 8)}...${address.slice(-4)}`;
    return (
      <button
        onClick={openWallet}
        className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
      >
        {displayName}
      </button>
    );
  }

  return (
    <button
      onClick={openConnect}
      className={clsx(
        "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors",
        large ? "px-8 py-3 text-base" : "px-4 py-2 text-sm"
      )}
    >
      Connect Wallet
    </button>
  );
}
