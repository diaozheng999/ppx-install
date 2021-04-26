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
}

type PackageSpec = string | [string, string];

type PackageSpecParsed = [string, PackageSpec[]];

function parsePpxJson(ctx: Platform, path: string) {
  ctx.log(`using ppx.json at: ${path}`);
  const ppxJson = require(path);
  ctx.log(`received ${JSON.stringify(ppxJson)}`);
  const keys = Object.keys(ppxJson);
  if (keys.length !== 1) {
    ctx.fatal("Unknown configuration.");
  }
  ctx.log(`key: ${keys[0]}`);
  return [keys[0], ppxJson[keys[0]]] as PackageSpecParsed;
}

function parsePackageJson(ctx: Platform) {
  const packageJson = require(resolve(ctx.cwd(), "package.json"));
  ctx.log(`using package.json at: ${packageJson}`);

  const ppx = packageJson.ppx;
  return [packageJson.name, ppx] as PackageSpecParsed;
}

export function parse(ctx: Platform) {
  const ppxJson = resolve(ctx.cwd(), `ppx.json`);

  let res: PackageSpecParsed;

  if (existsSync(ppxJson)) {
    res = parsePpxJson(ctx, ppxJson);
  } else {
    res = parsePackageJson(ctx);
  }

  const [name, ppx] = res;
  const packages: Package[] = [];

  ctx.log(`name: ${name}, ppx: ${JSON.stringify(ppx)}`);

  if (typeof ppx !== "object") {
    ctx.fatal("Cannot parse `ppx` key in `package.json`.");
  }

  for (const item of ppx) {
    if (typeof item === "string") {
      packages.push({ name: item, version: "*" });
    } else {
      packages.push({ name: item[0], version: item[1] });
    }
  }

  ctx.log(`packages: ${JSON.stringify(packages)}`);

  const ret = {
    name,
    packages,
    hash: md5(JSON.stringify([name, packages])),
  };

  ctx.log(`return value: ${JSON.stringify(ret)}`);

  ctx.log(new Error().stack!);

  return ret;
}
