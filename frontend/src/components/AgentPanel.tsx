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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white">AI Yield Agent</p>
          <p className="text-xs text-gray-500">Auto-optimizes your votes each epoch</p>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-green-400" : "bg-gray-600"}`} />
      </div>

      {error && (
        <div className="mb-2 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {isActive ? (
        <div className="space-y-2">
          <div className="bg-green-900/20 border border-green-800 rounded-lg px-3 py-2 text-xs text-green-400">
            Agent active — votes are managed automatically
          </div>
          <button
            onClick={handleRevokeAgent}
            disabled={loading}
            className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors py-1"
          >
            {loading ? "Processing..." : "Revoke agent access"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleEnableAgent}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
        >
          {loading ? "Enabling..." : "Enable AI Agent"}
        </button>
      )}
    </div>
  );
}
