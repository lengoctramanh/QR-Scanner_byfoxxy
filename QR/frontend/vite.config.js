import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/pictures": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/QRScan": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/QRSCANUSER": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/ProcessedQRScan": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/QRURL": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/BrandBatchAssets": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
