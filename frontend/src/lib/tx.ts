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
      getOfflineSigner: (chainId: string) => {
        getAccounts: () => Promise<{ address: string; pubkey: Uint8Array }[]>;
        signDirect: (...args: unknown[]) => unknown;
        signAmino: (...args: unknown[]) => unknown;
      };
    };
    leap?: typeof Window.prototype.keplr;
  }
}

async function getSigningClient() {
  const wallet = window.keplr ?? window.leap;
  if (!wallet) {
    throw new Error("No Cosmos wallet found. Please install Keplr or Leap.");
  }

  await wallet.experimentalSuggestChain({
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
    feeCurrencies: [{
      coinDenom: "VM", coinMinimalDenom: DENOM, coinDecimals: 6,
      gasPriceStep: { low: 0.015, average: 0.025, high: 0.04 },
    }],
    stakeCurrency: { coinDenom: "VM", coinMinimalDenom: DENOM, coinDecimals: 6 },
  });

  await wallet.enable(CHAIN_ID);

  const signer = wallet.getOfflineSigner(CHAIN_ID);
  const accounts = await signer.getAccounts();
  if (!accounts.length) {
    throw new Error("Keplr has no account for votemarket-1. Please unlock your wallet and approve the chain.");
  }

  const client = await SigningCosmWasmClient.connectWithSigner(RPC, signer, {
    gasPrice: GasPrice.fromString(`0.025${DENOM}`),
  });

  return { client, sender: accounts[0].address };
}

export async function execContract(
  _sender: string,
  contract: string,
  msg: object,
  funds: { denom: string; amount: string }[] = []
): Promise<string> {
  const { client, sender } = await getSigningClient();
  const result = await client.execute(sender, contract, msg, "auto", undefined, funds);
  return result.transactionHash;
}

/** Returns the Keplr/Leap address for votemarket-1 (may differ from InterwovenKit address). */
export async function getKeplrAddress(): Promise<string | null> {
  try {
    const wallet = window.keplr ?? window.leap;
    if (!wallet) return null;
    const signer = wallet.getOfflineSigner(CHAIN_ID);
    const accounts = await signer.getAccounts();
    return accounts[0]?.address ?? null;
  } catch {
    return null;
  }
}
