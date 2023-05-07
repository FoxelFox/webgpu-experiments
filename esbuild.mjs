import { build } from "esbuild";
import { glsl } from "esbuild-plugin-glsl";

await build({
    entryPoints: ["src/blub/main.ts"],
    outfile: "dist/index.js",
    bundle: true,
    plugins: [glsl({
        minify: true
    })]
}).catch(() => process.exit(1));;
