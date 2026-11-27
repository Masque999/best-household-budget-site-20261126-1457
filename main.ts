// 安家账本 · hand-in program: copies app/ and screenshots/ from this repository
// into the output directory and writes dossier.json with make.fun's frontend
// dossier library. Node 22, standard library only.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// NOTE: never rmSync outDir itself. The grader mounts the output directory
// (an empty writable /output), and rmSync on a mount point throws EBUSY
// ("Device or resource busy") even with force:true, failing the run with
// exit code 1. Only the previous run's known children are cleaned below.
mkdirSync(outDir, { recursive: true });

// Clear only the previous run's outputs inside the directory. These are
// ordinary paths, never the mount point itself, so rmSync on them is safe.
for (const name of ["app", "screenshots", "dossier.json"]) {
  rmSync(join(outDir, name), { recursive: true, force: true });
}
cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

console.log("wrote " + outDir + "/dossier.json");
