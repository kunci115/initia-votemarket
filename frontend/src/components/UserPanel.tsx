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

  const displayName = username ? `${username}.init` : `${address.slice(0, 8)}...`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Connected as</p>
        <p className="text-white font-semibold text-lg">{displayName}</p>
        {username && (
          <p className="text-xs text-gray-500 font-mono">{address.slice(0, 16)}...</p>
        )}
      </div>

      <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">VIP Score</p>
          <p className="text-xl font-bold text-indigo-400">
            {vipData?.score?.toString() ?? "—"}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Epoch</p>
          <p className="text-xl font-bold text-white">
            #{epoch?.id ?? "—"}
          </p>
        </div>
      </div>

      {vipData?.pending_rewards && (
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-lg p-3">
          <p className="text-xs text-indigo-400 mb-1">Pending Rewards</p>
          <p className="text-lg font-bold text-white">
            {(Number(vipData.pending_rewards) / 1_000_000).toFixed(4)} INIT
          </p>
        </div>
      )}
    </div>
  );
}
