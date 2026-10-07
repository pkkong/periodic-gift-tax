import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "baby-gift-tax-helper",

  brand: {
    primaryColor: "#0064FF"
  },

  permissions: [],

  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },

  webBundleDir: "dist"
});
