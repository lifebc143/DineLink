import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const outputRoot = new URL("../dist/public/", import.meta.url);
const runtimeEntry = new URL("../dist/index.js", import.meta.url);
const nextStatic = new URL("../.next/static/", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

if (existsSync(nextStatic)) {
  await cp(nextStatic, new URL("_next/static/", outputRoot), { recursive: true });
}

if (existsSync(publicRoot)) {
  await cp(publicRoot, outputRoot, { recursive: true, force: true });
}

await writeFile(new URL("deployment-ready.txt", outputRoot), "DineLink static assets prepared for deployment.\n");
await writeFile(runtimeEntry, "import '../.next/standalone/server.js';\n");
