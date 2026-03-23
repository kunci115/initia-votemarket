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
    : `${address.slice(0, 8)}...${address.slice(-4)}`;

  return (
    <div className="glass-card glow-border p-3.5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">
            {(username ?? address).slice(0, 1).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Wallet</p>
          <p className="text-white font-medium text-xs truncate font-mono">{displayName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2.5">
          <p className="text-[10px] text-slate-600 font-medium mb-1">VIP Score</p>
          <p className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            {vipData?.score ?? "—"}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2.5">
          <p className="text-[10px] text-slate-600 font-medium mb-1">Epoch</p>
          <p className="text-lg font-bold text-white">#{epoch?.id ?? "—"}</p>
        </div>
      </div>

      {vipData?.score && Number(vipData.score) > 0 ? (
        <div className="bg-emerald-500/[0.07] border border-emerald-500/15 rounded-lg px-2.5 py-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
              VIP Score Active
            </p>
            <p className="text-sm font-bold text-emerald-300 mt-0.5">{vipData.score} pts</p>
          </div>
          <svg className="w-5 h-5 text-emerald-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ) : epoch?.id ? (
        <p className="text-[10px] text-slate-700 text-center">No VIP score for epoch #{epoch.id}</p>
      ) : null}
    </div>
  );
}
