/**
 * Direct CosmWasm transaction helper for votemarket-1 rollup.
 * Uses Keplr's offline signer with CosmJS — bypasses InterwovenKit
 * chain registry since votemarket-1 is a custom hackathon rollup.
 */
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";

const RPC = process.env.NEXT_PUBLIC_RPC ?? "http://localhost:26657";
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "votemarket-1";
const DENOM = process.env.NEXT_PUBLIC_DENOM ?? "uvm";

declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      experimentalSuggestChain: (config: unknown) => Promise<void>;
      getOfflineSigner: (chainId: string) => { getAccounts: () => Promise<{ address: string }[]>; signDirect: (...args: unknown[]) => Promise<unknown> };
    };
  }
}

async function suggestChain() {
  if (!window.keplr) return;
  await window.keplr.experimentalSuggestChain({
    chainId: CHAIN_ID,
    chainName: "Votemarket Rollup",
    rpc: RPC,
    rest: process.env.NEXT_PUBLIC_REST ?? "http://localhost:1317",
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
}

export interface ExecMsg {
  typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract";
  value: {
    sender: string;
    contract: string;
    msg: string;
    funds: [];
  };
}

export async function execContract(msgs: ExecMsg[]): Promise<string> {
  if (!window.keplr) throw new Error("Keplr wallet not found. Please install Keplr.");

  try {
    await suggestChain();
    await window.keplr.enable(CHAIN_ID);
  } catch {
    // Chain may already be added
    await window.keplr.enable(CHAIN_ID);
  }

  const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
  const client = await SigningCosmWasmClient.connectWithSigner(
    RPC,
    offlineSigner as Parameters<typeof SigningCosmWasmClient.connectWithSigner>[1],
    { gasPrice: GasPrice.fromString(`0.025${DENOM}`) }
  );

  const result = await client.signAndBroadcast(
    msgs[0].value.sender,
    msgs,
    "auto"
  );

  if (result.code !== 0) {
    throw new Error(`Transaction failed: ${result.rawLog}`);
  }

  return result.transactionHash;
}
