"use client";

import { useState } from "react";
import { useBribeOffers } from "../hooks/useBribeOffers";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";
import { execContract } from "../lib/tx";

const VOTE_REGISTRY = process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "";

interface BribeBoardProps {
  address: string;
}

// Generate a consistent color from a string (for protocol avatars)
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
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

// Phase badge styling
function getPhaseBadge(phase?: string) {
  if (!phase) return { label: "Loading...", classes: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
  const p = phase.toLowerCase();
  if (p === "distribution") return { label: "Distribution", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  if (p === "deposit") return { label: "Deposit", classes: "bg-violet-500/10 text-violet-400 border-violet-500/20" };
  if (p === "snapshot") return { label: "Snapshot", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { label: phase, classes: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
}

export function BribeBoard({ address }: BribeBoardProps) {
  const { data: epoch } = useCurrentEpoch();
  const { data: offers, isLoading } = useBribeOffers(epoch?.id);
  const [delegating, setDelegating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelegate = async (protocolAddr: string) => {
    if (!epoch) return;
    setDelegating(protocolAddr);
    setError(null);
    try {
      await execContract(address, VOTE_REGISTRY, {
        delegate_votes: {
          epoch_id: epoch.id,
          protocol: protocolAddr,
          on_behalf_of: null,
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delegation failed");
    } finally {
      setDelegating(null);
    }
  };

  const phase = getPhaseBadge(epoch?.phase);
  const isDistribution = epoch?.phase === "Distribution";

  // Calculate total TVL across all offers
  const totalTvl = offers?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;
  const totalTvlInit = (totalTvl / 1_000_000).toFixed(2);

  return (
    <div className="glass-card glow-border p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-white font-semibold text-base mb-1">Active Bribes</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Epoch #{epoch?.id ?? "..."}</span>
            <span className="text-slate-700">·</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${phase.classes}`}>
              {phase.label}
            </span>
            {offers && offers.length > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">{totalTvlInit} INIT total</span>
              </>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-600 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-lg font-medium">
          4% fee
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-16 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!offers || offers.length === 0) && (
        <div className="text-center py-14">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.75 7.5h16.5M12 3v4.5" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">No bribes yet</p>
          <p className="text-slate-700 text-xs mt-1">No offers deposited for epoch #{epoch?.id ?? "..."}</p>
        </div>
      )}

      {/* Bribe list */}
      {!isLoading && offers && offers.length > 0 && (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 pb-1">
            <span className="text-xs text-slate-600 font-medium uppercase tracking-wider">Protocol</span>
            <span className="text-xs text-slate-600 font-medium uppercase tracking-wider text-right">Bribe</span>
            <span className="text-xs text-slate-600 font-medium uppercase tracking-wider w-24 text-center">Action</span>
          </div>

          {offers.map((offer, idx) => {
            const totalInit = (Number(offer.total_amount) / 1_000_000).toFixed(2);
            const shortAddr = `${offer.protocol.slice(0, 8)}...${offer.protocol.slice(-6)}`;
            const initials = offer.protocol.slice(0, 2).toUpperCase();
            const color = hashColor(offer.protocol);
            const isDelegating = delegating === offer.protocol;

            return (
              <div
                key={offer.protocol}
                className="group grid grid-cols-[1fr_auto_auto] gap-3 items-center bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.10] rounded-xl px-4 py-3 transition-all duration-200"
              >
                {/* Protocol identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white font-mono truncate">{shortAddr}</p>
                    <p className="text-xs text-slate-600">Deposit #{idx + 1}</p>
                  </div>
                </div>

                {/* Bribe amount */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{totalInit}</p>
                  <p className="text-xs text-slate-500">INIT</p>
                </div>

                {/* Delegate button */}
                <div className="w-24">
                  <button
                    onClick={() => handleDelegate(offer.protocol)}
                    disabled={isDelegating || !isDistribution}
                    title={!isDistribution ? `Delegation opens in Distribution phase (current: ${epoch?.phase})` : undefined}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white disabled:text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm shadow-violet-900/20 hover:shadow-violet-800/40 disabled:shadow-none"
                  >
                    {isDelegating ? (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        ...
                      </span>
                    ) : "Delegate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      {!isLoading && offers && offers.length > 0 && !isDistribution && (
        <p className="text-xs text-slate-600 text-center mt-4">
          Delegation opens when epoch enters Distribution phase
        </p>
      )}
    </div>
  );
}
