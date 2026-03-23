"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

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
      <IKProvider>{children}</IKProvider>
    </QueryClientProvider>
  );
}
