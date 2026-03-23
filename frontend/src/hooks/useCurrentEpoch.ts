import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const RPC = process.env.NEXT_PUBLIC_REST ?? "https://lcd.testnet.initia.xyz";
const EPOCH_CONTROLLER = process.env.NEXT_PUBLIC_EPOCH_CONTROLLER_ADDRESS ?? "";

export function useCurrentEpoch() {
  return useQuery({
    queryKey: ["currentEpoch"],
    queryFn: async () => {
      const query = Buffer.from(JSON.stringify({ current_epoch: {} })).toString("base64");
      try {
        const res = await axios.get(
          `${RPC}/cosmwasm/wasm/v1/contract/${EPOCH_CONTROLLER}/smart/${query}`
        );
        return res.data.data?.epoch as {
          id: number;
          phase: string;
          deposit_start: number;
          snapshot_height: number | null;
          distribution_start: number | null;
          closed_at: number | null;
        };
      } catch {
        // Contract returns 500 when no epoch has been created yet (CURRENT_EPOCH_ID=0, EPOCHS[0] not found)
        return null;
      }
    },
    refetchInterval: 5000,
    enabled: !!EPOCH_CONTROLLER,
  });
}
