import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("./src/", import.meta.url))
      },
      {
        find: /^ws$/,
        replacement: fileURLToPath(new URL("./src/test/ws-global-shim.ts", import.meta.url))
      }
    ]
  },
  test: {
    environment: "node",
    globals: true,
    include: [
      "src/**/*.{test,spec}.ts",
      "tests/**/*.{test,spec}.ts"
    ],
    setupFiles: ["./src/test/setup.ts"],
    server: {
      deps: {
        inline: ["engine.io-client", "socket.io-client"]
      }
    }
  }
});
