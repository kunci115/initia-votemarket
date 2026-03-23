import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const RPC = process.env.NEXT_PUBLIC_RPC ?? "https://rpc.testnet.initia.xyz";
const BRIBE_VAULT = process.env.NEXT_PUBLIC_BRIBE_VAULT_ADDRESS ?? "";

export interface BribeOffer {
  epoch_id: number;
  protocol: string;
  total_amount: string;
  deposited_at_height: number;
}

export function useBribeOffers(epochId?: number) {
  return useQuery({
    queryKey: ["bribeOffers", epochId],
    queryFn: async () => {
      const query = Buffer.from(
        JSON.stringify({ bribe_offers: { epoch_id: epochId } })
      ).toString("base64");
      const res = await axios.get(
        `${RPC}/cosmwasm/wasm/v1/contract/${BRIBE_VAULT}/smart/${query}`
      );
      return res.data.data?.offers as BribeOffer[];
    },
    enabled: !!epochId && !!BRIBE_VAULT,
    refetchInterval: 10000,
  });
}
