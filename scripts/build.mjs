// Gera o site pronto para o GitHub Pages na pasta docs/.
import { build } from "esbuild";
import { cp, rm, writeFile } from "node:fs/promises";

await rm("docs", { recursive: true, force: true });
await cp("public", "docs", { recursive: true });
await build({
  entryPoints: ["src/app.js"],
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  outfile: "docs/app.js",
  legalComments: "none",
});
// Sem isto o GitHub Pages ignora alguns arquivos.
await writeFile("docs/.nojekyll", "");
console.log("Site gerado em docs/");
