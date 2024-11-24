import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  entry: "./out/content.js",
  output: {
    filename: "content.js",
    path: resolve(__dirname, "./out"),
  },
  mode: "production",
};

export default config;
