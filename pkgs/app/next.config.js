/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@zk-ballot/core", "@zk-ballot/shared", "@zk-ballot/contract"],
  webpack: (config, { isServer }) => {
    // @midnight-ntwrk/compact-runtime pulls in a WASM binary
    // (@midnightntwrk/onchain-runtime-v4) for the real persistentHash
    // implementation. Webpack 5 doesn't enable WASM support by default —
    // this is the standard fix for wasm-bindgen-style packages in Next.js.
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };
    config.output.webassemblyModuleFilename = isServer
      ? "../static/wasm/[modulehash].wasm"
      : "static/wasm/[modulehash].wasm";
    return config;
  },
};
module.exports = nextConfig;
