import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const RPC = process.env.NEXT_PUBLIC_RPC ?? "https://rpc.testnet.initia.xyz";
const VOTE_REGISTRY = process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "";

export function useVipScore(address?: string, epochId?: number) {
  return useQuery({
    queryKey: ["vipScore", address, epochId],
    queryFn: async () => {
      const query = Buffer.from(
        JSON.stringify({ vip_score: { epoch_id: epochId, user: address } })
      ).toString("base64");
      const res = await axios.get(
        `${RPC}/cosmwasm/wasm/v1/contract/${VOTE_REGISTRY}/smart/${query}`
      );
      return res.data.data?.snapshot as {
        user: string;
        epoch_id: number;
        score: string;
        snapshot_height: number;
      } | null;
    },
    enabled: !!address && !!epochId && !!VOTE_REGISTRY,
  });
}
