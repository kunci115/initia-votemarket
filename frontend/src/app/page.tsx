"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { ConnectButton } from "../components/ConnectButton";
import { BribeBoard } from "../components/BribeBoard";
import { UserPanel } from "../components/UserPanel";
import { AgentPanel } from "../components/AgentPanel";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";

function EpochBadge() {
  const { data: epoch } = useCurrentEpoch();

  const phaseColor = () => {
    if (!epoch) return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    const p = epoch.phase.toLowerCase();
    if (p === "distribution") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (p === "deposit") return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    if (p === "snapshot") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-600">Epoch</span>
      <span className="text-slate-300 font-mono font-medium">#{epoch?.id ?? "—"}</span>
      <span className="text-slate-700">·</span>
      {epoch ? (
        <span className={`px-2 py-0.5 rounded-full border font-medium ${phaseColor()}`}>
          {epoch.phase}
        </span>
      ) : (
        <span className="text-slate-600">—</span>
      )}
    </div>
  );
}

export default function Home() {
  const kit = useInterwovenKit();
  const address = kit?.address;
  const username = kit?.username;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050510]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-bold text-sm">Votemarket</span>
              <span className="text-violet-400 font-bold text-sm">.init</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <span className="w-px h-4 bg-white/10" />
              <EpochBadge />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <a
              href="https://initia.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Initia
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-6">
        {/* Not connected: landing */}
        {!address && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {/* Subtle top badge */}
            <div className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 pulse-dot" />
              Live on Initia Testnet
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Put your VIP votes to work
            </h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              Protocols bid INIT for your Initia VIP gauge votes. Delegate once,
              earn every epoch — or let the AI agent do it automatically.
            </p>

            <ConnectButton large />

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/[0.06] w-full max-w-xs">
              {[
                { label: "Fee", value: "4%" },
                { label: "Network", value: "votemarket-1" },
                { label: "Reward", value: "INIT" },
              ].map((s, i, arr) => (
                <div key={s.label} className={`flex-1 text-center ${i < arr.length - 1 ? "border-r border-white/[0.06]" : ""}`}>
                  <p className="text-white font-semibold text-sm">{s.value}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected: dashboard */}
        {address && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            {/* Left sidebar */}
            <div className="space-y-3">
              <UserPanel address={address} username={username} />
              <AgentPanel address={address} />

              <div className="glass-card p-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">How it works</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pick a bribe, delegate your VIP votes, earn INIT when the epoch closes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main: bribe board */}
            <BribeBoard address={address} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-700">Votemarket.init — Initia Hackathon 2025</p>
          <p className="text-xs text-slate-700">votemarket-1</p>
        </div>
      </footer>
    </div>
  );
}
