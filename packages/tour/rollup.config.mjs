import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";

const is_prod = process.env.BUILD === "prod";

const dev_plugins = [
  nodeResolve({
    jsnext: true,
  }),
  typescript(),
  scss({
    fileName: is_prod ? "bundle.min.css" : "bundle.css",
    outputStyle: is_prod ? "compressed" : null,
  }),
];

const prod_plugins = [terser()];

const plugins = is_prod ? [...dev_plugins, ...prod_plugins] : dev_plugins;

export default {
  input: "src/tour.ts",
  output: {
    file: is_prod ? "out/bundle.min.js" : "out/bundle.js",
    format: "es",
    sourcemap: is_prod ? false : "inline",
  },
  plugins,
  watch: {
    exclude: ["node_modules/**"],
  },
};
