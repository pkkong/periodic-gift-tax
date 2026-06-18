import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "baby-gift-tax-helper",
  brand: {
    displayName: "우리 아기 증여 도우미",
    primaryColor: "#0064FF",
    icon: "https://pkkong.github.io/periodic-gift-tax/icon.svg",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  outdir: "dist",
});
