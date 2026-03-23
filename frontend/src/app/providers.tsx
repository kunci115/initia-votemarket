"use client";

import dynamic from "next/dynamic";
import { useEffect, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
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

function EthRpcErrorSuppressor({ children }: PropsWithChildren) {
  useEffect(() => {
    // InterwovenKit probes the injected EVM provider (eth_accounts) during init.
    // Keplr rejects this with {code: -32603} — an object, not an Error —
    // which surfaces as "[object Object]" in Next.js's unhandled rejection UI.
    // Suppress it: it has no effect on Cosmos wallet functionality.
    const handler = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      if (r && typeof r === "object" && (r.code === -32603 || r.code === 4001)) {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return <>{children}</>;
}

export function InterwovenKitProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <EthRpcErrorSuppressor>
          <IKProvider>{children}</IKProvider>
        </EthRpcErrorSuppressor>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
