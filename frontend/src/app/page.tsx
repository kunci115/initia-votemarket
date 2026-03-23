"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { ConnectButton } from "../components/ConnectButton";
import { BribeBoard } from "../components/BribeBoard";
import { UserPanel } from "../components/UserPanel";
import { AgentPanel } from "../components/AgentPanel";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";

function PhaseLabel({ phase }: { phase?: string }) {
  if (!phase) return null;
  const p = phase.toLowerCase();
  if (p === "distribution") return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-medium">Distribution</span>;
  if (p === "deposit") return <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-3 py-1 text-xs font-medium">Deposit</span>;
  if (p === "snapshot") return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1 text-xs font-medium">Snapshot</span>;
  return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full px-3 py-1 text-xs font-medium">{phase}</span>;
}

function StatsBar() {
  const { data: epoch } = useCurrentEpoch();
  return (
    <div className="glass-card px-5 py-3">
      <div className="flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">Epoch</span>
          <span className="text-sm font-semibold text-white">#{epoch?.id ?? "—"}</span>
        </div>
        <div className="w-px h-4 bg-white/10 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">Phase</span>
          <PhaseLabel phase={epoch?.phase} />
        </div>
        <div className="w-px h-4 bg-white/10 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">Network</span>
          <span className="text-xs font-medium text-slate-400">votemarket-1</span>
        </div>
        <div className="w-px h-4 bg-white/10 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">Protocol Fee</span>
          <span className="text-xs font-semibold text-slate-300">4%</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // Guard against kit not ready on first render (dynamic ssr:false component)
  const kit = useInterwovenKit();
  const address = kit?.address;
  const username = kit?.username;

  return (
    <div className="relative min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050510]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-sm tracking-tight">Votemarket</span>
              <span className="text-violet-400 font-bold text-sm">.init</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-white/10" />
            <span className="hidden sm:block text-xs text-slate-600 font-medium">VIP Gauge Bribe Marketplace</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="https://initia.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Initia
            </a>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Stats bar — always visible */}
        <StatsBar />

        {/* Hero — when not connected */}
        {!address && (
          <div className="relative py-20 text-center overflow-hidden">
            {/* Decorative glow rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-96 h-96 rounded-full border border-violet-500/10 absolute" />
              <div className="w-72 h-72 rounded-full border border-violet-500/10 absolute" />
              <div className="w-48 h-48 rounded-full bg-violet-600/5 blur-3xl absolute" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-300 font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 pulse-dot" />
              Live on Initia Testnet
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5">
              <span className="text-white">Put your </span>
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                VIP votes
              </span>
              <br />
              <span className="text-white">to work</span>
            </h1>

            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Protocols bid INIT for your Initia VIP gauge voting power.
              Delegate manually or let the AI agent maximize your yield every epoch.
            </p>

            {/* CTA */}
            <ConnectButton large />

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              {[
                { icon: "⚡", label: "Instant delegation" },
                { icon: "🤖", label: "AI yield agent" },
                { icon: "🔒", label: "Non-custodial" },
                { icon: "💎", label: "INIT rewards" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2 text-xs text-slate-400"
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected: main dashboard */}
        {address && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left sidebar: user info + agent */}
            <div className="lg:col-span-1 space-y-4">
              <UserPanel address={address} username={username} />
              <AgentPanel address={address} />

              {/* Info card */}
              <div className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-1">How it works</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Choose a protocol bribe, delegate your VIP votes, and earn a share of the INIT bribe reward at the end of the epoch.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: bribe marketplace */}
            <div className="lg:col-span-2">
              <BribeBoard address={address} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-xs text-slate-700">
            Votemarket.init — Initia Hackathon 2025
          </p>
          <p className="text-xs text-slate-700">
            Built on Initia · votemarket-1
          </p>
        </div>
      </footer>
    </div>
  );
}
