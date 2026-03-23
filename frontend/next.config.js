/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Transpile interwovenkit through SWC so ESM `import { useEffectEvent }`
  // becomes CJS `require('react').useEffectEvent` — which works because React
  // 19.2.4 exports it in its CJS build. Webpack's static ESM analysis can't
  // detect useEffectEvent through react/index.js's conditional require().
  transpilePackages: ["@initia/interwovenkit-react"],
};

module.exports = nextConfig;
