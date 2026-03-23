"use client";

import { useState } from "react";
import { useBribeOffers } from "../hooks/useBribeOffers";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";
import { execContract } from "../lib/tx";

const VOTE_REGISTRY = process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "";

interface BribeBoardProps {
  address: string;
}

function phaseBadge(phase?: string) {
  if (!phase) return { label: "—", cls: "bg-slate-500/10 text-slate-500 border-slate-500/20" };
  const p = phase.toLowerCase();
  if (p === "distribution") return { label: "Distribution", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  if (p === "deposit")      return { label: "Deposit",      cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" };
  if (p === "snapshot")     return { label: "Snapshot",     cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
  return { label: phase, cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
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
        delegate_votes: { epoch_id: epoch.id, protocol: protocolAddr, on_behalf_of: null },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delegation failed");
    } finally {
      setDelegating(null);
    }
  };

  const phase = phaseBadge(epoch?.phase);
  const isDistribution = epoch?.phase?.toLowerCase() === "distribution";
  const totalTvl = ((offers?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0) / 1_000_000).toFixed(2);

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Active Bribes</h2>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">Epoch #{epoch?.id ?? "—"}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${phase.cls}`}>
            {phase.label}
          </span>
          {offers && offers.length > 0 && (
            <span className="text-xs text-slate-600">{totalTvl} INIT total</span>
          )}
        </div>
        <span className="text-xs text-slate-600">4% fee</span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-10 rounded-md" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!offers || offers.length === 0) && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">{!epoch ? "No active epoch" : "No bribes yet"}</p>
          <p className="text-slate-700 text-xs mt-1">
            {!epoch ? "Waiting for admin to open an epoch" : `No offers deposited for epoch #${epoch.id}`}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && offers && offers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left text-slate-600 font-medium uppercase tracking-wider px-4 py-2.5">#</th>
                <th className="text-left text-slate-600 font-medium uppercase tracking-wider px-4 py-2.5">Protocol</th>
                <th className="text-right text-slate-600 font-medium uppercase tracking-wider px-4 py-2.5">Bribe (INIT)</th>
                <th className="text-right text-slate-600 font-medium uppercase tracking-wider px-4 py-2.5">Share</th>
                <th className="text-center text-slate-600 font-medium uppercase tracking-wider px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {offers.map((offer, idx) => {
                const amount = Number(offer.total_amount) / 1_000_000;
                const share = totalTvl !== "0.00"
                  ? ((amount / parseFloat(totalTvl)) * 100).toFixed(1)
                  : "—";
                const isDelegating = delegating === offer.protocol;

                return (
                  <tr key={offer.protocol} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-700">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {offer.protocol.slice(0, 10)}…{offer.protocol.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{share}%</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelegate(offer.protocol)}
                        disabled={isDelegating || !isDistribution}
                        title={!isDistribution ? `Opens in Distribution phase (current: ${epoch?.phase})` : undefined}
                        className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white disabled:text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-md transition-all duration-150 min-w-[72px]"
                      >
                        {isDelegating ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : "Delegate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {offers.length > 1 && (
              <tfoot>
                <tr className="border-t border-white/[0.06]">
                  <td colSpan={2} className="px-4 py-2.5 text-slate-600 text-xs">{offers.length} protocols</td>
                  <td className="px-4 py-2.5 text-right text-xs font-semibold text-white">{totalTvl}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500">100%</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {!isLoading && offers && offers.length > 0 && !isDistribution && (
        <p className="text-[10px] text-slate-700 text-center px-4 py-2.5 border-t border-white/[0.04]">
          Delegation opens when epoch enters Distribution phase
        </p>
      )}
    </div>
  );
}
