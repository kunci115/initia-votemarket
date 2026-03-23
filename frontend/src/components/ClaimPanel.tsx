"use client";

import { useState } from "react";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";
import { useUserReward } from "../hooks/useUserReward";
import { execContract } from "../lib/tx";

const BRIBE_VAULT = process.env.NEXT_PUBLIC_BRIBE_VAULT_ADDRESS ?? "";

interface ClaimPanelProps {
  address: string;
}

export function ClaimPanel({ address }: ClaimPanelProps) {
  const { data: epoch } = useCurrentEpoch();
  const { data: reward, refetch } = useUserReward(address, epoch?.id);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isClosed = epoch?.phase?.toLowerCase() === "closed";
  const amount = Number(reward?.amount ?? 0) / 1_000_000;
  const hasPending = amount > 0 && !reward?.claimed;

  const handleClaim = async () => {
    if (!epoch) return;
    setLoading(true); setError(null); setTxHash(null);
    try {
      const hash = await execContract(address, BRIBE_VAULT, {
        claim_rewards: { epoch_id: epoch.id, on_behalf_of: null },
      });
      setTxHash(hash);
      await new Promise(r => setTimeout(r, 3000));
      await refetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  };

  // Only show this panel when epoch is closed or reward is available
  if (!isClosed && !hasPending) return null;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <p className="text-xs font-semibold text-white">Epoch #{epoch?.id} Rewards</p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          reward?.claimed
            ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
            : hasPending
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-white/[0.03] text-slate-600 border-white/[0.06]"
        }`}>
          {reward?.claimed ? "Claimed" : hasPending ? "Claimable" : "None"}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="text-slate-600 py-1">Your reward</td>
              <td className="text-right font-semibold text-white">
                {amount > 0 ? `${amount.toFixed(4)} INIT` : "—"}
              </td>
            </tr>
            <tr>
              <td className="text-slate-600 py-1">Status</td>
              <td className="text-right text-slate-400">
                {!isClosed ? "Epoch still open" : reward?.claimed ? "Already claimed" : "Ready to claim"}
              </td>
            </tr>
          </tbody>
        </table>

        {error && (
          <div className="bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
        {txHash && (
          <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-400">
            ✓ Rewards claimed!
            <span className="block text-[10px] text-emerald-600 font-mono mt-0.5">{txHash.slice(0, 16)}…{txHash.slice(-8)}</span>
          </div>
        )}

        {isClosed && hasPending && (
          <button
            onClick={handleClaim}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg py-2 transition-all duration-200"
          >
            {loading ? "Claiming…" : `Claim ${amount.toFixed(4)} INIT`}
          </button>
        )}
      </div>
    </div>
  );
}
