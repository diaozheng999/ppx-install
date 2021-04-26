import Command from "@oclif/command";
import { existsSync, unlinkSync, watch, writeFileSync } from "fs";
import { resolve } from "path";
import { EsyInstall } from "./esy-install";
import { Platform } from "./platform";

export class PpxBuilderSingleton extends Platform {
  #buildLockFile: string;

  constructor(ctx: Command, elevated?: string) {
    super(ctx, elevated);

    this.#buildLockFile = resolve(this.cwd(), "__ppx_build.lock");

    this.cleanup.push(this.#buildLockFile);
  }

  async main(): Promise<void> {
    if (existsSync(this.#buildLockFile) && !this.elevated()) {
      this.log("waiting for ongoing build to finish.");
      return new Promise((res) => {
        const watcher = watch(this.cwd(), (event, filename) => {
          if (event === "rename" && filename === "__ppx_build.lock") {
            if (!existsSync(this.#buildLockFile)) {
              watcher.close();
              res();
            }
          }
        });
      });
    } else {
      writeFileSync(this.#buildLockFile, "\n");
      this.log("creating Esy project.");
      try {
        await this.spawn(EsyInstall).run({
          shouldElevateInWindows: true,
          arg1: "--install",
        });
      } finally {
        if (existsSync(this.#buildLockFile)) {
          unlinkSync(this.#buildLockFile);
        }
      }
    }
  }
}
