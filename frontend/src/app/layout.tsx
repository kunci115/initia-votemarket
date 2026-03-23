import type { Metadata } from "next";
import { InterwovenKitProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Votemarket.init — VIP Gauge Bribe Marketplace",
  description:
    "Earn yield by delegating your Initia VIP gauge votes. Protocols bid INIT for your voting power.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <InterwovenKitProvider>{children}</InterwovenKitProvider>
      </body>
    </html>
  );
}
