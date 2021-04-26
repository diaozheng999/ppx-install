import { existsSync, mkdirSync, writeFile as writeFile_ } from "fs";
import { resolve } from "path";
import { promisify } from "util";
import { Platform } from "./platform";
import { Package } from "./spec";

const writeFile = promisify(writeFile_);

export function clobberName(name: string) {
  return `ppx_${name.replace(/\W/g, "_")}`;
}

export function buildPackageJson(name: string, deps: Package[]) {
  const dependencies: Record<string, string> = {
    ocaml: "4.11.x",
    "@opam/dune": "2.8.4",
  };

  for (const { name, version } of deps) {
    dependencies[name] = version;
  }

  return JSON.stringify({
    name,
    dependencies,
    esy: {
      build: "dune build -p #{self.name}",
    },
  });
}

export function buildDuneFile(name: string, packages: string[]) {
  return `(library
    (name ${name})
    (public_name ${name})
    (kind ppx_rewriter)
    (libraries ${packages.join(" ")})
    (preprocess no_preprocessing))`;
}

export async function generateProject(
  ctx: Platform,
  name: string,
  deps: Package[],
) {
  const ppxName = clobberName(name);
  const projDir = resolve(ctx.cwd(), "_ppx");
  const projSrcDir = resolve(projDir, "src");

  if (existsSync(projDir)) {
    ctx.log("project exists.");
    return ppxName;
  }

  ctx.log("creating project directory");
  mkdirSync(projDir);
  mkdirSync(projSrcDir);
  ctx.log("generating project");
  await Promise.all([
    writeFile(
      resolve(projDir, "package.json"),
      buildPackageJson(ppxName, deps),
    ),
    writeFile(resolve(projDir, `${ppxName}.opam`), "\n"),
    writeFile(
      resolve(projDir, "dune-project"),
      `(lang dune 2.8)\n(name "${ppxName}")\n`,
    ),
  ]);
  return ppxName;
}

/**
 * Assumes you're already in the project directory
 */
export async function writeDuneFile(
  ctx: Platform,
  name: string,
  packages: string[],
) {
  ctx.log("writing dune file");
  return writeFile(resolve("src", "dune"), buildDuneFile(name, packages));
}
