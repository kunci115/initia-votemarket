"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { ConnectButton } from "../components/ConnectButton";
import { BribeBoard } from "../components/BribeBoard";
import { UserPanel } from "../components/UserPanel";
import { AgentPanel } from "../components/AgentPanel";
import { ClaimPanel } from "../components/ClaimPanel";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";

function EpochBadge() {
  const { data: epoch } = useCurrentEpoch();
  const p = epoch?.phase?.toLowerCase();
  const cls = p === "distribution" ? "text-emerald-400"
    : p === "deposit" ? "text-violet-400"
    : p === "snapshot" ? "text-amber-400"
    : "text-slate-500";

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <span>Epoch <span className="text-slate-400 font-mono">#{epoch?.id ?? "—"}</span></span>
      {epoch && <span className={`font-medium ${cls}`}>· {epoch.phase}</span>}
    </div>
  );
}

const STEPS = [
  { phase: "deposit",      label: "1. Deposit",      desc: "Protocols lock INIT bribes" },
  { phase: "snapshot",     label: "2. Snapshot",     desc: "VIP scores are frozen" },
  { phase: "distribution", label: "3. Distribution", desc: "Delegate your votes here" },
  { phase: "closed",       label: "4. Closed",       desc: "Rewards paid out" },
];

function PhaseGuide() {
  const { data: epoch } = useCurrentEpoch();
  const current = epoch?.phase?.toLowerCase() ?? "";

  return (
    <div className="glass-card px-4 py-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {STEPS.map((step, i) => {
          const done = ["deposit","snapshot","distribution","closed"].indexOf(current) > i;
          const active = current === step.phase;
          return (
            <div key={step.phase} className="flex items-center gap-1 flex-shrink-0">
              {i > 0 && <div className={`w-8 h-px ${done ? "bg-violet-500/50" : "bg-white/[0.06]"}`} />}
              <div className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                active  ? "bg-violet-500/15 border-violet-500/30 text-violet-300" :
                done    ? "bg-white/[0.03] border-white/[0.05] text-slate-500 line-through" :
                          "bg-white/[0.02] border-white/[0.04] text-slate-700"
              }`}>
                <span className="font-semibold">{step.label}</span>
                <span className="hidden sm:inline text-[10px] ml-1.5 opacity-70">{step.desc}</span>
              </div>
            </div>
          );
        })}
        {current === "distribution" && (
          <p className="text-[10px] text-emerald-400 ml-3 flex-shrink-0">← Delegate now to earn INIT</p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const kit = useInterwovenKit();
  const address = kit?.address;
  const username = kit?.username;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050510]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Votemarket<span className="text-violet-400">.init</span></span>
            <span className="hidden sm:block w-px h-3.5 bg-white/10 mx-1" />
            <span className="hidden sm:block"><EpochBadge /></span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://initia.xyz" target="_blank" rel="noopener noreferrer"
              className="hidden sm:block text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Initia ↗
            </a>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-5">
        {/* Not connected */}
        {!address && (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
            <div className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 pulse-dot" />
              Live on Initia Testnet
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
              Put your VIP votes to work
            </h1>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
              Protocols bid INIT for your gauge votes. Delegate once, earn every epoch — or let the AI agent handle it.
            </p>
            <ConnectButton large />
            <div className="flex items-center gap-8 mt-8 pt-6 border-t border-white/[0.05]">
              {[["4%", "Protocol fee"], ["INIT", "Reward token"], ["votemarket-1", "Network"]].map(([val, lbl]) => (
                <div key={lbl} className="text-center">
                  <p className="text-white font-semibold text-sm">{val}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected dashboard */}
        {address && (
          <div className="space-y-3">
            <PhaseGuide />
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
              <div className="space-y-3">
                <UserPanel address={address} username={username} />
                <ClaimPanel address={address} />
                <AgentPanel address={address} />
              </div>
              <BribeBoard address={address} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-slate-700">Votemarket.init — Initia Hackathon 2025</p>
          <p className="text-xs text-slate-700">votemarket-1</p>
        </div>
      </footer>
    </div>
  );
}
