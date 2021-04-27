import { copyFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { getPackageNames } from "./esy-internals";
import { Platform } from "./platform";
import { generateProject, writeDuneFile } from "./ppx-builder";
import { parse } from "./spec";

export class EsyInstall extends Platform {
  async main() {
    const buildLockFile = resolve(this.cwd(), "__ppx_build.lock");

    const specs = parse(this);
    const ppxName = await generateProject(this, specs.name, specs.packages);
    this.dir(resolve(this.cwd(), "_ppx"), async () => {
      this.log("PPX project name: " + ppxName);
      this.exec("npx esy");
      const packageNames = getPackageNames(this, specs.packages);
      await writeDuneFile(this, ppxName, packageNames);
      this.exec("npx esy build");
      this.exec("npx esy dune install --prefix build");
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
