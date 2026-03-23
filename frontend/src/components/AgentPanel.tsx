"use client";

import { useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useSessionKey } from "../hooks/useSessionKey";

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "";

interface AgentPanelProps {
  address: string;
}

export function AgentPanel({ address }: AgentPanelProps) {
  const { signAndBroadcast } = useInterwovenKit();
  const { data: sessionKey, refetch } = useSessionKey(address, AGENT_ADDRESS);
  const [loading, setLoading] = useState(false);

  const handleEnableAgent = async () => {
    setLoading(true);
    try {
      // Register session key in VoteRegistry contract
      await signAndBroadcast({
        msgs: [
          {
            typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
            value: {
              sender: address,
              contract: process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS,
              msg: Buffer.from(
                JSON.stringify({
                  register_session_key: {
                    agent: AGENT_ADDRESS,
                    can_delegate: true,
                    can_claim: true,
                    max_weight_change_bps: 10000,
                    allowed_protocols: [],
                  },
                })
              ).toString("base64"),
              funds: [],
            },
          },
        ],
      });
      await refetch();
    } catch (e) {
      console.error("Failed to enable agent:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAgent = async () => {
    setLoading(true);
    try {
      await signAndBroadcast({
        msgs: [
          {
            typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
            value: {
              sender: address,
              contract: process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS,
              msg: Buffer.from(
                JSON.stringify({
                  revoke_session_key: { agent: AGENT_ADDRESS },
                })
              ).toString("base64"),
              funds: [],
            },
          },
        ],
      });
      await refetch();
    } catch (e) {
      console.error("Failed to revoke agent:", e);
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
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isActive ? "bg-green-400" : "bg-gray-600"
          }`}
        />
      </div>

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
