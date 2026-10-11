import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Route navigations run as React view transitions: project titles morph
  // from the landing card into the case-study cover (see ProjectCard/CasePage).
  experimental: { viewTransition: true },
};

export default nextConfig;
