import { ds } from "@nasi/boost";
import { lstat, readdirSync } from "fs";
import { resolve } from "path";
import { intersects, subset } from "semver";
import { promisify } from "util";
import { Platform } from "./platform";
import { Package, parse, Result } from "./spec";

const lstatp = promisify(lstat);

export type DependencyList = Map<string, DependencySpec>;

export interface Dependency {
  name: string;
  path: string;
}

export interface DependencySpec extends Result {
  originalName: string;
  path: string;
}

export class DepsParser {
  #ctx: Platform;
  #dependencies = new Map<string, DependencySpec>();
  #folders = new ds.LinkedList<string>();

  constructor(ctx: Platform) {
    this.#ctx = ctx;
  }

  parsePackage({ name, path }: Dependency) {
    const spec = parse(this.#ctx, path, false);
    if (spec) {
      let key = name;
      if (this.#dependencies.has(key)) {
        for (let i = 0; this.#dependencies.has(key); ++i) {
          key = `${name}_${i}`;
        }
      }
      this.#dependencies.set(key, {
        ...spec,
        originalName: name,
        path,
      });
    }
  }

  async chompDependency(path: string) {
    for (const file of readdirSync(path)) {
      if (file === "node_modules") {
        this.#folders.push(resolve(path, file));
      } else if (file === "package.json") {
        const { name } = require(resolve(path, file));
        this.parsePackage({ name, path });
      } else {
        const stat = await lstatp(resolve(path, file));
        if (!stat.isSymbolicLink() && stat.isDirectory()) {
          this.#folders.push(resolve(path, file));
        }
      }
    }
  }

  async get() {
    this.#folders.push(this.#ctx.resolve("node_modules"));
    while (true) {
      const p = this.#folders.pop();
      if (!p) {
        return this.#dependencies;
      }
      await this.chompDependency(p);
    }
  }
}

export function unifyDeps(
  ctx: Platform,
  original: Package[],
  deps: DependencyList,
): Package[] {
  const p: Map<string, string> = new Map();

  const add = ({ name, version }: Package) => {
    const prevVersion = p.get(name);
    if (prevVersion === undefined) {
      p.set(name, version);
    } else if (subset(version, prevVersion)) {
      p.set(name, version);
    } else if (!intersects(version, prevVersion)) {
      ctx.fatal(
        `Package ${name} contains disjoint versions ${version} and ${prevVersion}.
This is not supported at this time.`,
      );
    } else {
      p.set(name, `${version} || ${prevVersion}`);
    }
  };
  original.forEach(add);
  for (const v of deps.values()) {
    v.packages.forEach(add);
  }
  return Array.from(p.entries()).map(([name, version]) => ({ name, version }));
}
