import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const REST = process.env.NEXT_PUBLIC_REST ?? "http://localhost:1317";
const BRIBE_VAULT = process.env.NEXT_PUBLIC_BRIBE_VAULT_ADDRESS ?? "";

export function useUserReward(user?: string, epochId?: number) {
  return useQuery({
    queryKey: ["userReward", user, epochId],
    queryFn: async () => {
      const query = Buffer.from(
        JSON.stringify({ user_reward: { epoch_id: epochId, user } })
      ).toString("base64");
      try {
        const res = await axios.get(
          `${REST}/cosmwasm/wasm/v1/contract/${BRIBE_VAULT}/smart/${query}`
        );
        return res.data.data as { amount: string; claimed: boolean };
      } catch {
        return { amount: "0", claimed: false };
      }
    },
    enabled: !!user && !!epochId && !!BRIBE_VAULT,
    refetchInterval: 5000,
  });
}
