"use client";

import { useState } from "react";
import { useSessionKey } from "../hooks/useSessionKey";
import { execContract } from "../lib/tx";

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "";
const VOTE_REGISTRY = process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "";

interface AgentPanelProps {
  address: string;
}

export function AgentPanel({ address }: AgentPanelProps) {
  const { data: sessionKey, refetch } = useSessionKey(address, AGENT_ADDRESS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnableAgent = async () => {
    if (!AGENT_ADDRESS) { setError("Agent address not configured."); return; }
    setLoading(true); setError(null);
    try {
      await execContract(address, VOTE_REGISTRY, {
        register_session_key: {
          agent: AGENT_ADDRESS,
          can_delegate: true,
          can_claim: true,
          max_weight_change_bps: 10000,
          allowed_protocols: [],
        },
      });
      await refetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAgent = async () => {
    setLoading(true); setError(null);
    try {
      await execContract(address, VOTE_REGISTRY, { revoke_session_key: { agent: AGENT_ADDRESS } });
      await refetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const isActive = !!sessionKey?.record;

  return (
    <div className="glass-card glow-border p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isActive ? "bg-emerald-500/20 border border-emerald-500/25" : "bg-white/[0.04] border border-white/[0.08]"
          }`}>
            <svg className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">AI Yield Agent</p>
            <p className="text-[10px] text-slate-600">Auto-optimizes votes each epoch</p>
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/[0.03] text-slate-600 border-white/[0.06]"
        }`}>
          {isActive ? "Active" : "Off"}
        </span>
      </div>

      {error && (
        <div className="mb-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-2.5 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {isActive ? (
        <div className="space-y-2">
          <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-lg px-2.5 py-2 text-xs text-emerald-400/80 flex items-center gap-1.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Managing votes automatically
          </div>
          <button onClick={handleRevokeAgent} disabled={loading}
            className="w-full text-xs text-slate-600 hover:text-red-400 transition-colors py-1 disabled:opacity-50">
            {loading ? "Processing..." : "Revoke access"}
          </button>
        </div>
      ) : (
        <button onClick={handleEnableAgent} disabled={loading}
          className="w-full group relative bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg py-2 transition-all duration-200">
          {loading ? "Enabling..." : "Enable AI Agent"}
          <span className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}
