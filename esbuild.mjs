import { build } from "esbuild";
import { glsl } from "esbuild-plugin-glsl";
import {wasmLoader} from "esbuild-plugin-wasm";

await build({
    entryPoints: ["src/main.ts"],
    outfile: "dist/main.js",
    logLevel: "info",
    bundle: true,
    format: "esm",
    sourcemap: true,
    tsconfig: "tsconfig.json",
    minify: true,
    plugins: [
        glsl({minify: true}),
        wasmLoader()
    ]
}).catch(() => process.exit(1));
