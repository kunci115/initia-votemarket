"use client";

import { InterwovenKitProvider as IKProvider } from "@initia/interwovenkit-react";

// Initia testnet config — replace with mainnet when ready
const INITIA_CHAIN_CONFIG = {
  chainId: "initiation-2",
  chainName: "Initia Testnet",
  rpc: "https://rpc.testnet.initia.xyz",
  rest: "https://lcd.testnet.initia.xyz",
  bech32Prefix: "init",
  currencies: [
    {
      coinDenom: "INIT",
      coinMinimalDenom: "uinit",
      coinDecimals: 6,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "INIT",
      coinMinimalDenom: "uinit",
      coinDecimals: 6,
      gasPriceStep: { low: 0.015, average: 0.025, high: 0.04 },
    },
  ],
  stakeCurrency: {
    coinDenom: "INIT",
    coinMinimalDenom: "uinit",
    coinDecimals: 6,
  },
};

export function InterwovenKitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IKProvider
      chainId={INITIA_CHAIN_CONFIG.chainId}
      // InterwovenKit handles wallet connection, social login, session keys
    >
      {children}
    </IKProvider>
  );
}
