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
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Wallet</p>
        <p className="text-xs font-mono text-slate-300 mt-0.5 truncate">{displayName}</p>
      </div>

      <table className="w-full text-xs">
        <tbody className="divide-y divide-white/[0.04]">
          <tr>
            <td className="px-4 py-2.5 text-slate-600">VIP Score</td>
            <td className="px-4 py-2.5 text-right font-semibold text-white">
              {vipData?.score ?? "—"}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2.5 text-slate-600">Epoch</td>
            <td className="px-4 py-2.5 text-right font-semibold text-white">
              #{epoch?.id ?? "—"}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2.5 text-slate-600">Phase</td>
            <td className="px-4 py-2.5 text-right text-slate-400">
              {epoch?.phase ?? "—"}
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2.5 text-slate-600">Status</td>
            <td className="px-4 py-2.5 text-right">
              {vipData?.score && Number(vipData.score) > 0 ? (
                <span className="text-emerald-400 font-medium">Active</span>
              ) : (
                <span className="text-slate-600">No score</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
