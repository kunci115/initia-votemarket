import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const RPC = process.env.NEXT_PUBLIC_REST ?? "https://lcd.testnet.initia.xyz";
const VOTE_REGISTRY = process.env.NEXT_PUBLIC_VOTE_REGISTRY_ADDRESS ?? "";

export function useSessionKey(userAddress?: string, agentAddress?: string) {
  return useQuery({
    queryKey: ["sessionKey", userAddress, agentAddress],
    queryFn: async () => {
      const query = Buffer.from(
        JSON.stringify({ session_key: { user: userAddress, agent: agentAddress } })
      ).toString("base64");
      const res = await axios.get(
        `${RPC}/cosmwasm/wasm/v1/contract/${VOTE_REGISTRY}/smart/${query}`
      );
      return res.data.data as {
        record: {
          user: string;
          agent: string;
          can_delegate: boolean;
          can_claim: boolean;
        } | null;
      };
    },
    enabled: !!userAddress && !!agentAddress && !!VOTE_REGISTRY,
  });
}
