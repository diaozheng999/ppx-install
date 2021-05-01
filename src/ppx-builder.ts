import {
  existsSync,
  mkdirSync,
  writeFile as writeFile_,
  writeFileSync,
} from "fs";
import { resolve } from "path";
import { promisify } from "util";
import { Platform } from "./platform";
import { Package } from "./spec";
import { removeAllIfExists, removeIfExistsSync } from "./utils";

const writeFile = promisify(writeFile_);

export function clobberName(name: string, appendPpx = false) {
  const clobbered = name
    .replace(/\@/g, "scope_")
    .replace(/\W/g, "_")
    .replace(/^_/, "");
  if (appendPpx) {
    return `ppx_${clobbered}`;
  }
  return clobbered;
}

export function buildPackageJson(name: string, deps: Package[]) {
  const dependencies: Record<string, string> = {
    ocaml: "4.11.x",
    "@opam/dune": "2.8.4",
  };

  for (const { name, version } of deps) {
    dependencies[name] = version;
  }

  return JSON.stringify(
    {
      name,
      esy: {
        build: "dune build -p #{self.name}",
      },
      dependencies,
    },
    undefined,
    2,
  );
}

export function buildDuneFile(
  name: string,
  packages: string[],
  publicName: string,
) {
  return `(library
    (name ${name})
    (public_name ${publicName})
    (kind ppx_rewriter)
    (libraries ${packages.join(" ")})
    (preprocess no_preprocessing))`;
}

function mkdirIfNotExistSync(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
}

export async function reconcileProject(
  ctx: Platform,
  projDir: string,
  projSrcDir: string,
) {
  if (existsSync(projDir)) {
    ctx.log("| project already exists.");
    await removeAllIfExists(
      projDir,
      (name) =>
        !!/^_ppx_\w+\.exe$/.exec(name) ||
        name.endsWith(".opam") ||
        name.endsWith(".install") ||
        name === "build" ||
        name.startsWith("dep"),
    );
    removeIfExistsSync(resolve(projSrcDir, "dune"));
  } else {
    ctx.log("| creating project directory.");
  }
  mkdirIfNotExistSync(projDir);
  mkdirIfNotExistSync(projSrcDir);
}

export async function generateProject(
  ctx: Platform,
  name: string,
  deps: Package[],
  appendPpx: boolean,
) {
  const ppxName = clobberName(name, appendPpx);
  const projDir = resolve(ctx.cwd(), "_ppx");
  const projSrcDir = resolve(projDir, "src");

  await reconcileProject(ctx, projDir, projSrcDir);

  ctx.log("| generating project files.");
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

const fixPpxFlags = (dep: string) => (item: string | string[]) => {
  if (typeof item === "string") {
    if (item.startsWith("ppx-install")) {
      return [item, `--dep=${dep}`];
    }
    return item;
  }
  if (item[0].startsWith("ppx-install")) {
    const len = item.length;
    for (let i = 1; i < len; ++i) {
      if (item[i].startsWith("--dep")) {
        item[i] = `--dep=${dep}`;
      }
      return item;
    }
  }
  return item;
};

export function changeBsConfig(ctx: Platform, dep: string, path: string) {
  const bsconfigPath = resolve(path, "bsconfig.json");
  const bsconfig = require(bsconfigPath);
  const ndep = `${dep}#"${ctx.cwd()}"`;

  if (
    bsconfig.__ppx_install_injected &&
    bsconfig.__ppx_install_injected === ndep
  ) {
    ctx.log(`: ${ndep} already updated.`);
    return;
  }

  bsconfig.__ppx_install_injected = ndep;
  bsconfig["ppx-flags"] = bsconfig["ppx-flags"].map(fixPpxFlags(ndep));
  ctx.log(`: ${ndep} updating ${bsconfigPath}`);
  writeFileSync(bsconfigPath, JSON.stringify(bsconfig, undefined, 2));
}

/**
 * Assumes you're already in the project directory
 */
export async function writeDuneFile(
  ctx: Platform,
  name: string,
  packages: string[],
  dep?: string,
) {
  const path = dep ?? "src";
  const publicName = dep ? `${name}.${dep}` : name;
  mkdirIfNotExistSync(path);
  ctx.log(dep ? `| writing dune file for ${dep}` : "| writing dune file.");
  return writeFile(
    resolve(path, "dune"),
    buildDuneFile(dep ?? name, packages, publicName),
  );
}
