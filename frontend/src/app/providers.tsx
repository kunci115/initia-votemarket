"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";

const queryClient = new QueryClient();

// Minimal wagmi config — no connectors, no auto-detection of injected
// wallets (prevents eth_accounts RPC calls to Keplr/MetaMask on mount)
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
  multiInjectedProviderDiscovery: false,
});

// InterwovenKit accesses browser-only globals — must not SSR
const IKProvider = dynamic(
  () =>
    import("@initia/interwovenkit-react").then((m) => {
      const { InterwovenKitProvider, TESTNET } = m;
      return function Provider({ children }: PropsWithChildren) {
        return <InterwovenKitProvider {...TESTNET}>{children}</InterwovenKitProvider>;
      };
    }),
  { ssr: false }
);

export function InterwovenKitProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <IKProvider>{children}</IKProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
