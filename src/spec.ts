import { existsSync } from "fs";
import { resolve } from "path";
import { Platform } from "./platform";

const md5 = require("md5");

export interface Package {
  name: string;
  version: string;
}

export interface Result {
  name: string;
  packages: Package[];
  hash: string;
  hasPpxJson: boolean;
}

type PackageSpec = string | [string, string];

type PackageSpecParsed = [string, PackageSpec[]];

function parsePpxJson(ctx: Platform, path: string, verbose: boolean) {
  const ppxJson = require(path);
  ctx.logv(verbose, `using ppx.json at: ${path}`);

  const keys = Object.keys(ppxJson);
  if (keys.length !== 1) {
    return;
  }
  return [keys[0], ppxJson[keys[0]]] as PackageSpecParsed;
}

function parsePackageJson(ctx: Platform, cwd: string, verbose: boolean) {
  const packageJsonLocation = resolve(cwd, "package.json");
  const packageJson = require(packageJsonLocation);
  ctx.logv(verbose, `using package.json at: ${packageJsonLocation}`);

  const ppx = packageJson.ppx;
  return [packageJson.name, ppx] as PackageSpecParsed;
}

export function parse(ctx: Platform, path?: string, verbose = true) {
  const cwd = path ?? ctx.cwd();
  const ppxJson = resolve(cwd, `ppx.json`);

  let res: PackageSpecParsed;

  let hasPpxJson = false;

  if (existsSync(ppxJson)) {
    const _res = parsePpxJson(ctx, ppxJson, verbose);
    if (!_res) {
      return;
    }
    res = _res;
    hasPpxJson = true;
  } else {
    res = parsePackageJson(ctx, cwd, verbose);
  }

  const [name, ppx] = res;
  const packages: Package[] = [];

  if (typeof ppx !== "object") {
    return;
  }

  for (const item of ppx) {
    if (typeof item === "string") {
      packages.push({ name: item, version: "*" });
    } else {
      packages.push({ name: item[0], version: item[1] });
    }
  }

  const ret = {
    name,
    packages,
    hash: md5(JSON.stringify([name, packages])),
    hasPpxJson,
  };
  ctx.logv(verbose, `hash: ${ret.hash}`);

  return ret;
}
