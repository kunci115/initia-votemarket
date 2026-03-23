"use client";

import type { PropsWithChildren } from "react";
import {
  InterwovenKitProvider as IKProvider,
  TESTNET,
} from "@initia/interwovenkit-react";

export function InterwovenKitProvider({ children }: PropsWithChildren) {
  return <IKProvider {...TESTNET}>{children}</IKProvider>;
}
