import { copyFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { getPackageNames } from "./esy-internals";
import { DepsParser, unifyDeps } from "./parse-deps";
import { Platform } from "./platform";
import {
  changeBsConfig,
  clobberName,
  generateProject,
  writeDuneFile,
} from "./ppx-builder";
import { parse } from "./spec";

export class EsyInstall extends Platform {
  async main() {
    const buildLockFile = resolve(this.cwd(), "__ppx_build.lock");
    const specs = parse(this);
    if (!specs) {
      this.fatal("Cannot understand the list of PPXes.");
    }
    const deps = await new DepsParser(this).get();
    const allDeps = unifyDeps(this, specs.packages, deps);
    const ppxName = await generateProject(
      this,
      specs.name,
      allDeps,
      !specs.hasPpxJson,
    );
    this.dir(resolve(this.cwd(), "_ppx"), async () => {
      this.log("PPX project name: " + ppxName);
      this.exec("npx esy");

      const clobberedDeps: Record<string, string> = {};

      for (const [name, dep] of deps) {
        const clobbered = clobberName(name);
        const depName = `dep_${clobbered}`;
        clobberedDeps[name] = clobbered;
        const packageNames = getPackageNames(this, dep.packages);
        await writeDuneFile(this, ppxName, packageNames, depName);
      }
      const packageNames = getPackageNames(this, specs.packages);
      await writeDuneFile(this, ppxName, packageNames);
      this.exec("npx esy build");
      this.exec("npx esy dune install --prefix build");

      for (const [name, dep] of deps) {
        this.log(`: copying ppx for dependency ${name}`);
        const clobbered = clobberedDeps[name];
        copyFileSync(
          this.resolve(
            "_ppx",
            "build",
            "lib",
            ppxName,
            `dep_${clobbered}`,
            "ppx.exe",
          ),
          this.resolve("_ppx", `_ppx_${clobbered}.exe`),
        );
        changeBsConfig(this, clobbered, dep.path);
      }

      this.log(": copying ppx.exe");
      copyFileSync(
        resolve(this.cwd(), "_ppx", "build", "lib", ppxName, "ppx.exe"),
        resolve(this.cwd(), "_ppx", `ppx.exe`),
      );
      this.log(": copied ppx.exe");
      if (!existsSync(resolve(this.cwd(), "_ppx", `ppx.exe`))) {
        this.fatal("Copied ppx.exe does not seem to exist in file system.");
      } else if (existsSync(buildLockFile)) {
        unlinkSync(buildLockFile);
      }
    });
  }
}
