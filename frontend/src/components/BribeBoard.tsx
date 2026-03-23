"use client";

import { useState } from "react";
import { useBribeOffers } from "../hooks/useBribeOffers";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";
import { execContract } from "../lib/tx";

const VOTE_REGISTRY = process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "";

interface BribeBoardProps {
  address: string;
}

function hashColor(str: string): string {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-indigo-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
  return colors[Math.abs(hash) % colors.length];
}

function phaseBadge(phase?: string) {
  if (!phase) return { label: "—", cls: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
  const p = phase.toLowerCase();
  if (p === "distribution") return { label: "Distribution", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  if (p === "deposit") return { label: "Deposit", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" };
  if (p === "snapshot") return { label: "Snapshot", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { label: phase, cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
}

export function BribeBoard({ address }: BribeBoardProps) {
  const { data: epoch } = useCurrentEpoch();
  const { data: offers, isLoading } = useBribeOffers(epoch?.id);
  const [delegating, setDelegating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelegate = async (protocolAddr: string) => {
    if (!epoch) return;
    setDelegating(protocolAddr); setError(null);
    try {
      await execContract(address, VOTE_REGISTRY, {
        delegate_votes: { epoch_id: epoch.id, protocol: protocolAddr, on_behalf_of: null },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delegation failed");
    } finally {
      setDelegating(null);
    }
  };

  const phase = phaseBadge(epoch?.phase);
  const isDistribution = epoch?.phase === "Distribution";
  const totalTvl = ((offers?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0) / 1_000_000).toFixed(2);

  return (
    <div className="glass-card glow-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Active Bribes</h2>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">Epoch #{epoch?.id ?? "—"}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${phase.cls}`}>{phase.label}</span>
          {offers && offers.length > 0 && (
            <span className="text-xs text-slate-600">{totalTvl} INIT</span>
          )}
        </div>
        <span className="text-xs text-slate-700 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md">4% fee</span>
      </div>

      {error && (
        <div className="mb-3 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-12 rounded-lg" />)}
        </div>
      )}

      {!isLoading && (!offers || offers.length === 0) && (
        <div className="text-center py-10">
          <p className="text-slate-500 text-sm font-medium">
            {!epoch ? "No active epoch" : "No bribes yet"}
          </p>
          <p className="text-slate-700 text-xs mt-1">
            {!epoch ? "Waiting for admin to open an epoch" : `No offers for epoch #${epoch.id}`}
          </p>
        </div>
      )}

      {!isLoading && offers && offers.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 pb-1">
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Protocol</span>
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider text-right">Bribe</span>
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider w-20 text-center">Action</span>
          </div>

          {offers.map((offer, idx) => {
            const totalInit = (Number(offer.total_amount) / 1_000_000).toFixed(2);
            const shortAddr = `${offer.protocol.slice(0, 6)}...${offer.protocol.slice(-4)}`;
            const initials = offer.protocol.slice(2, 4).toUpperCase();
            const isDelegating = delegating === offer.protocol;

            return (
              <div key={offer.protocol}
                className="grid grid-cols-[1fr_auto_auto] gap-3 items-center bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-lg px-3 py-2.5 transition-all duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${hashColor(offer.protocol)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[10px] font-bold">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white font-mono truncate">{shortAddr}</p>
                    <p className="text-[10px] text-slate-700">#{idx + 1}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{totalInit}</p>
                  <p className="text-[10px] text-slate-600">INIT</p>
                </div>

                <div className="w-20">
                  <button
                    onClick={() => handleDelegate(offer.protocol)}
                    disabled={isDelegating || !isDistribution}
                    title={!isDistribution ? `Opens in Distribution phase (current: ${epoch?.phase})` : undefined}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white disabled:text-slate-500 text-xs font-semibold px-2 py-1.5 rounded-md transition-all duration-150">
                    {isDelegating ? (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </span>
                    ) : "Delegate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && offers && offers.length > 0 && !isDistribution && (
        <p className="text-[10px] text-slate-700 text-center mt-3">
          Delegation opens in Distribution phase
        </p>
      )}
    </div>
  );
}
