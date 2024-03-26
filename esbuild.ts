import { context } from "esbuild";
import { glsl } from "esbuild-plugin-glsl";
import {wasmLoader} from "esbuild-plugin-wasm";


async function build(){
    let ctx = await context({
        entryPoints: ["src/main.ts"],
        outfile: "dist/main.js",
        logLevel: "info",
        bundle: true,
        format: "esm",
        sourcemap: true,
        tsconfig: "tsconfig.json",
        minify: false,
        plugins: [
            glsl({minify: false}),
            wasmLoader()
        ]
    }).catch(() => process.exit(1));

    await ctx.watch();
}

build();
