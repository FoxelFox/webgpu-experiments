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

function serve() {
    const BASE_PATH = ".";
    Bun.serve({
      port: 3000,
      async fetch(req) {
        
        const pathname = new URL(req.url).pathname;
        const filePath = BASE_PATH + ((pathname === "/") ? "index.html" : pathname);
        const file = Bun.file(filePath);
        
        return new Response(file);
      },
      error() {
        return new Response(undefined, { status: 404 });
      },
    });
}

build();
serve();
