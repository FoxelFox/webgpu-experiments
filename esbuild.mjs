import { context } from "esbuild";
import { glsl } from "esbuild-plugin-glsl";

let ctx = await context({
    entryPoints: ["src/blub/main.ts"],
    outfile: "dist/index.js",
    logLevel: "info",
    bundle: true,
    sourcemap: true,
    tsconfig: "tsconfig.json",
    plugins: [glsl({
        minify: true
    })]
}).catch(() => process.exit(1));

await ctx.watch();
