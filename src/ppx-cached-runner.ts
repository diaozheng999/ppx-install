import Command from "@oclif/command";
import { existsSync } from "fs";
import { resolve } from "path";
import { Platform } from "./platform";
import { PpxBuilderSingleton } from "./ppx-builder-singleton";

export class PpxCachedRunner extends Platform {
  #input: string;
  #output: string;
  #dep?: string;

  constructor(
    ctx: Command,
    elevated: string | undefined,
    input: string,
    output: string,
    dep?: string,
  ) {
    super(ctx, elevated);
    this.#input = input;
    this.#output = output;
    this.#dep = dep;
  }

  getPpx() {
    if (this.#dep) {
      const [dep, path] = this.#dep.split("#");
      return resolve(path, "_ppx", `_ppx_${dep}.exe`);
    }
    return this.resolve("_ppx", "ppx.exe");
  }

  async main() {
    const cached = this.getPpx();

    if (existsSync(cached)) {
      this.exec(`"${cached}" -as-ppx "${this.#input}" "${this.#output}"`);
      return;
    }

    await this.spawn(PpxBuilderSingleton).run();
    // somehow waiting to the next tick will allow the file to exist on the
    // file system
    await new Promise((res) => setTimeout(res, 400));
    this.exec(`"${cached}" -as-ppx "${this.#input}" "${this.#output}"`);
  }
}
