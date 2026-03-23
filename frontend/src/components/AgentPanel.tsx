"use client";

import { useEffect, useState } from "react";
import { useSessionKey } from "../hooks/useSessionKey";
import { execContract, getKeplrAddress } from "../lib/tx";

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "";
const VOTE_REGISTRY = process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "";

interface AgentPanelProps {
  address: string;
}

export function AgentPanel({ address }: AgentPanelProps) {
  // The address from InterwovenKit may differ from the Keplr signing address.
  // Use the Keplr address for the on-chain session key query.
  const [signerAddress, setSignerAddress] = useState<string>(address);
  useEffect(() => {
    getKeplrAddress().then(a => { if (a) setSignerAddress(a); });
  }, [address]);

  const { data: sessionKey, refetch } = useSessionKey(signerAddress, AGENT_ADDRESS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleEnable = async () => {
    if (!AGENT_ADDRESS) { setError("Agent address not configured."); return; }
    setLoading(true); setError(null); setTxHash(null);
    try {
      const hash = await execContract(address, VOTE_REGISTRY, {
        register_session_key: {
          agent: AGENT_ADDRESS,
          can_delegate: true,
          can_claim: true,
          max_weight_change_bps: 10000,
          allowed_protocols: [],
        },
      });
      setTxHash(hash);
      await new Promise(r => setTimeout(r, 3000));
      await refetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true); setError(null); setTxHash(null);
    try {
      const hash = await execContract(address, VOTE_REGISTRY, {
        revoke_session_key: { agent: AGENT_ADDRESS },
      });
      setTxHash(hash);
      await new Promise(r => setTimeout(r, 3000));
      await refetch();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const isActive = !!sessionKey?.record;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div>
          <p className="text-xs font-semibold text-white">AI Yield Agent</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Auto-optimizes votes each epoch</p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
          isActive
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-white/[0.03] text-slate-600 border-white/[0.06]"
        }`}>
          {isActive ? "Active" : "Off"}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {error && (
          <div className="bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {txHash && (
          <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-400">
            ✓ Transaction submitted
            <span className="block text-[10px] text-emerald-600 font-mono mt-0.5 truncate">
              {txHash.slice(0, 16)}…{txHash.slice(-8)}
            </span>
          </div>
        )}

        {isActive ? (
          <>
            <p className="text-xs text-emerald-400/80">Managing your votes automatically.</p>
            <button onClick={handleRevoke} disabled={loading}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50">
              {loading ? "Processing…" : "Revoke access"}
            </button>
          </>
        ) : (
          <button onClick={handleEnable} disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg py-2 transition-all duration-200">
            {loading ? "Waiting for block…" : "Enable AI Agent"}
          </button>
        )}
      </div>
    </div>
  );
}
