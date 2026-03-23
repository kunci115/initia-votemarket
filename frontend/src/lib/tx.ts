/**
 * Direct CosmWasm transaction helper for votemarket-1 rollup.
 * Uses Keplr's offline signer with CosmJS — bypasses InterwovenKit
 * chain registry since votemarket-1 is a custom hackathon rollup.
 */
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";

const RPC = process.env.NEXT_PUBLIC_RPC ?? "http://localhost:26657";
const REST = process.env.NEXT_PUBLIC_REST ?? "http://localhost:1317";
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "votemarket-1";
const DENOM = process.env.NEXT_PUBLIC_DENOM ?? "uvm";

declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      experimentalSuggestChain: (config: unknown) => Promise<void>;
      getOfflineSigner: (chainId: string) => Parameters<typeof SigningCosmWasmClient.connectWithSigner>[1];
    };
  }
}

async function getSigningClient() {
  if (!window.keplr) throw new Error("Keplr wallet not found. Please install Keplr.");

  // Register chain with Keplr if not already known
  await window.keplr.experimentalSuggestChain({
    chainId: CHAIN_ID,
    chainName: "Votemarket Rollup",
    rpc: RPC,
    rest: REST,
    bip44: { coinType: 118 },
    bech32Config: {
      bech32PrefixAccAddr: "init",
      bech32PrefixAccPub: "initpub",
      bech32PrefixValAddr: "initvaloper",
      bech32PrefixValPub: "initvaloperpub",
      bech32PrefixConsAddr: "initvalcons",
      bech32PrefixConsPub: "initvalconspub",
    },
    currencies: [{ coinDenom: "VM", coinMinimalDenom: DENOM, coinDecimals: 6 }],
    feeCurrencies: [{ coinDenom: "VM", coinMinimalDenom: DENOM, coinDecimals: 6, gasPriceStep: { low: 0.015, average: 0.025, high: 0.04 } }],
    stakeCurrency: { coinDenom: "VM", coinMinimalDenom: DENOM, coinDecimals: 6 },
  });

  await window.keplr.enable(CHAIN_ID);
  const signer = window.keplr.getOfflineSigner(CHAIN_ID);

  return SigningCosmWasmClient.connectWithSigner(RPC, signer, {
    gasPrice: GasPrice.fromString(`0.025${DENOM}`),
  });
}

/**
 * Execute a CosmWasm contract message.
 * Uses client.execute() which handles all encoding internally.
 */
export async function execContract(
  sender: string,
  contract: string,
  msg: object,
  funds: { denom: string; amount: string }[] = []
): Promise<string> {
  const client = await getSigningClient();
  const result = await client.execute(sender, contract, msg, "auto", undefined, funds);
  return result.transactionHash;
}
