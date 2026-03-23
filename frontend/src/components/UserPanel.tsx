"use client";

import { useVipScore } from "../hooks/useVipScore";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";

interface UserPanelProps {
  address: string;
  username?: string;
}

export function UserPanel({ address, username }: UserPanelProps) {
  const { data: epoch } = useCurrentEpoch();
  const { data: vipData } = useVipScore(address, epoch?.id);

  const displayName = username
    ? `${username}.init`
    : `${address.slice(0, 10)}...${address.slice(-6)}`;

  const pendingInit = vipData?.score
    ? null // score is the VIP score, not pending rewards
    : null;

  return (
    <div className="glass-card glow-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/40">
          <span className="text-white font-bold text-sm">
            {(username ?? address).slice(0, 1).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-0.5">
            Connected Wallet
          </p>
          <p className="text-white font-semibold text-sm truncate">{displayName}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1 font-medium">VIP Score</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            {vipData?.score ?? "—"}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1 font-medium">Epoch</p>
          <p className="text-2xl font-bold text-white">
            #{epoch?.id ?? "—"}
          </p>
        </div>
      </div>

      {/* Pending rewards */}
      {vipData?.score && Number(vipData.score) > 0 && (
        <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400/80 mb-1 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                VIP Score Active
              </p>
              <p className="text-lg font-bold text-emerald-300">
                {vipData.score} pts
              </p>
            </div>
            <div className="text-emerald-400/50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {(!vipData || !vipData.score) && epoch?.id && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
          <p className="text-xs text-slate-600 text-center">
            No VIP score for epoch #{epoch.id}
          </p>
        </div>
      )}
    </div>
  );
}
