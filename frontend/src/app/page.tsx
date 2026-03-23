"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { ConnectButton } from "../components/ConnectButton";
import { BribeBoard } from "../components/BribeBoard";
import { UserPanel } from "../components/UserPanel";
import { AgentPanel } from "../components/AgentPanel";

export default function Home() {
  const { address, username } = useInterwovenKit();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Votemarket.init</h1>
          <p className="text-xs text-gray-400">VIP Gauge Bribe Marketplace</p>
        </div>
        <ConnectButton />
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        {!address && (
          <div className="text-center py-16">
            <h2 className="text-4xl font-bold mb-4">
              Put your VIP votes to work
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
              Protocols bid INIT for your Initia VIP gauge voting power.
              Delegate manually or let the AI agent maximize your yield every epoch.
            </p>
            <ConnectButton large />
          </div>
        )}

        {address && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User stats + delegation */}
            <div className="lg:col-span-1 space-y-4">
              <UserPanel address={address} username={username} />
              <AgentPanel address={address} />
            </div>

            {/* Bribe marketplace */}
            <div className="lg:col-span-2">
              <BribeBoard address={address} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
