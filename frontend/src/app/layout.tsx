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
      <head>
        {/* Suppress unhandled EVM probe rejections BEFORE Next.js dev overlay registers its listener.
            InterwovenKit calls eth_accounts on the injected provider during init;
            Keplr rejects with {code:-32603} (not an Error instance) → shows as "[object Object]".
            We wrap window.ethereum.request so eth_accounts never rejects — returns [] instead. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  function patchEthereum() {
    if (!window.ethereum) return;
    var _req = window.ethereum.request.bind(window.ethereum);
    window.ethereum.request = function(args) {
      var p = _req(args);
      if (args && (args.method === 'eth_accounts' || args.method === 'eth_requestAccounts')) {
        return p.catch(function(e) {
          if (e && typeof e === 'object' && (e.code === -32603 || e.code === 4001)) return [];
          throw e;
        });
      }
      return p;
    };
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', patchEthereum);
  } else {
    patchEthereum();
  }
  // Also suppress any that slip through
  window.addEventListener('unhandledrejection', function(e) {
    var r = e.reason;
    if (r && typeof r === 'object' && (r.code === -32603 || r.code === 4001)) {
      e.preventDefault();
    }
  }, true);
})();
`,
          }}
        />
      </head>
      <body>
        <InterwovenKitProvider>{children}</InterwovenKitProvider>
      </body>
    </html>
  );
}
