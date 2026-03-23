"use client";

import { useState } from "react";
import { useBribeOffers } from "../hooks/useBribeOffers";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";
import { execContract } from "../lib/tx";

interface BribeBoardProps {
  address: string;
}

export function BribeBoard({ address }: BribeBoardProps) {
  const { data: epoch } = useCurrentEpoch();
  const { data: offers, isLoading } = useBribeOffers(epoch?.id);
  const [delegating, setDelegating] = useState<string | null>(null);

  const handleDelegate = async (protocolAddr: string) => {
    if (!epoch) return;
    setDelegating(protocolAddr);
    try {
      await execContract([
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: address,
            contract: process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "",
            msg: Buffer.from(
              JSON.stringify({
                delegate_votes: {
                  epoch_id: epoch.id,
                  protocol: protocolAddr,
                  on_behalf_of: null,
                },
              })
            ).toString("base64"),
            funds: [],
          },
        },
      ]);
    } catch (e) {
      console.error("Delegation failed:", e);
    } finally {
      setDelegating(null);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-semibold">Active Bribes</h2>
          <p className="text-xs text-gray-500">
            Epoch #{epoch?.id ?? "..."} · {epoch?.phase ?? "Loading..."}
          </p>
        </div>
        <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          4% protocol fee
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500 text-sm">
          Loading bribe offers...
        </div>
      )}

      {!isLoading && (!offers || offers.length === 0) && (
        <div className="text-center py-12 text-gray-600 text-sm">
          No bribes deposited yet for this epoch
        </div>
      )}

      <div className="space-y-3">
        {offers?.map((offer) => {
          const totalInit = (Number(offer.total_amount) / 1_000_000).toFixed(2);
          const shortAddr = `${offer.protocol.slice(0, 10)}...${offer.protocol.slice(-4)}`;

          return (
            <div
              key={offer.protocol}
              className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{shortAddr}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {totalInit} INIT total bribe
                </p>
              </div>

              <button
                onClick={() => handleDelegate(offer.protocol)}
                disabled={delegating === offer.protocol || epoch?.phase !== "Distribution"}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                {delegating === offer.protocol ? "Delegating..." : "Delegate"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
