import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@lm/ui", "@lm/types", "@lm/validation", "@lm/config", "@lm/data"],
  poweredByHeader: false,
  experimental: { agentUpgrade: "security" },
};
export default config;
