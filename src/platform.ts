import { execSync, ExecSyncOptions } from "child_process";
import { unlinkSync } from "fs";
import { resolve } from "path";

export class Platform {
  #platform = process.platform;
  #elevated = false;
  #cwd: string;

  #log: (message: string) => void;
  #execOptions: ExecSyncOptions;

  constructor(elevated?: string) {
    if (this.#platform === "win32" && elevated) {
      this.#elevated = true;
      this.#cwd = elevated;
      this.#execOptions = { stdio: "inherit" };
      this.#log = console.log;
    } else {
      this.#cwd = process.cwd();
      this.#execOptions = { stdio: [0, 2, 2] };
      this.#log = console.error;
    }
  }

  main() {}

  run(triggeredCommand: string) {
    if (this.#platform === "win32" && !this.#elevated) {
      this.exec(
        `cscript.exe "${resolve(__dirname, "ppx.vbs")}" "${triggeredCommand}"`,
      );
      return;
    }

    if (this.#platform === "win32") {
      process.chdir(resolve(this.#cwd));
    }
    this.main();
    if (this.#platform === "win32") {
      unlinkSync("__ppx_elevated_prompt.lock");
    }
  }

  exec(command: string) {
    this.#log(`> ${command}`);
    execSync(command, this.#execOptions);
  }
}
