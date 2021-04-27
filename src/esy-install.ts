import { copyFile as copyFile_ } from "fs";
import { resolve } from "path";
import { promisify } from "util";
import { getPackageNames } from "./esy-internals";
import { Platform } from "./platform";
import { generateProject, writeDuneFile } from "./ppx-builder";
import { parse } from "./spec";

const copyFile = promisify(copyFile_);

export class EsyInstall extends Platform {
  async main() {
    const specs = parse(this);
    const ppxName = await generateProject(this, specs.name, specs.packages);
    this.dir(resolve(this.cwd(), "_ppx"), async () => {
      this.log("PPX project name: " + ppxName);
      this.exec("npx esy");
      const packageNames = getPackageNames(this, specs.packages);
      await writeDuneFile(this, ppxName, packageNames);
      this.exec("npx esy build");
      this.exec("npx esy dune install --prefix build");
      await copyFile(
        resolve(this.cwd(), "_ppx", "build", "lib", ppxName, "ppx.exe"),
        resolve(this.cwd(), "_ppx", `_ppx_${specs.hash}.exe`),
      );
    });
  }
}
