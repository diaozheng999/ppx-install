import Command from "@oclif/command";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";
import { Platform } from "./platform";
import { PpxBuilderSingleton } from "./ppx-builder-singleton";
import { parse } from "./spec";

export function execute(ctx: Platform, input: string, output: string) {
  const specs = parse(ctx);

  const cached = resolve(ctx.cwd(), "_ppx", `_ppx_${specs.hash}.exe`);

  if (existsSync(cached)) {
    execSync(`"${cached}" -as-ppx "${input}" "${output}"`, {
      stdio: "inherit",
    });
    return;
  }
  return specs;
}

export class PpxCachedRunner extends Platform {
  #input: string;
  #output: string;

  constructor(
    ctx: Command,
    elevated: string | undefined,
    input: string,
    output: string,
  ) {
    super(ctx, elevated);
    this.#input = input;
    this.#output = output;
  }

  async main() {
    const cached = resolve(this.cwd(), "_ppx", `ppx.exe`);

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
