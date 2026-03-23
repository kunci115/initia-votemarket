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
    if (!AGENT_ADDRESS) {
      setError("Agent address not configured.");
      return;
    }
    setLoading(true);
    setError(null);
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
    setLoading(true);
    setError(null);
    try {
      await execContract(address, VOTE_REGISTRY, {
        revoke_session_key: { agent: AGENT_ADDRESS },
      });
      await refetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const isActive = !!sessionKey?.record;

  return (
    <div className="glass-card glow-border p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* AI icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isActive
              ? "bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/30"
              : "bg-white/[0.04] border border-white/[0.08]"
          }`}>
            <svg className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Yield Agent</p>
            <p className="text-xs text-slate-500">Auto-optimizes votes each epoch</p>
          </div>
        </div>

        {/* Toggle indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
          isActive
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-white/[0.04] text-slate-500 border-white/[0.08]"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 pulse-dot" : "bg-slate-600"}`} />
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2.5 text-xs text-red-400 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Actions */}
      {isActive ? (
        <div className="space-y-2.5">
          <div className="bg-emerald-500/[0.07] border border-emerald-500/15 rounded-xl px-3 py-2.5 text-xs text-emerald-400/90 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Agent is managing your votes automatically
          </div>
          <button
            onClick={handleRevokeAgent}
            disabled={loading}
            className="w-full text-xs text-slate-600 hover:text-red-400 transition-colors py-1.5 disabled:opacity-50 font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : "Revoke agent access"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleEnableAgent}
          disabled={loading}
          className="w-full group relative bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-200 shadow-md shadow-violet-900/30 hover:shadow-violet-800/50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enabling...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Enable AI Agent
            </span>
          )}
          <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
      )}
    </div>
  );
}
