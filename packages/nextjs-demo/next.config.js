const path = require("path");

const absolutePluginPath = path.resolve(
  "../react-hook-swc-transform/target/wasm32-wasi/debug/react_hook_swc_transform.wasm"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    swcPlugins: [[absolutePluginPath, {}]],
  },
};

module.exports = nextConfig;
