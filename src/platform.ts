import Command from "@oclif/command";
import { execSync, ExecSyncOptions } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";
import { removeIfExistsSync } from "./utils";

interface RunOptions {
  shouldElevateInWindows?: boolean;
  arg1?: string;
  silent?: boolean;
}

export class Platform {
  #platform = process.platform;
  #elevated = false;
  #cwd: string;

  #log: (message: string) => void;
  #execOptions: ExecSyncOptions = { stdio: "inherit" };

  #ctx: Command;

  #silent = false;

  cleanup: string[] = [];

  constructor(ctx: Command, elevated?: string) {
    if (this.#platform === "win32" && elevated) {
      this.#elevated = true;
      this.#cwd = elevated;
      this.#log = console.log;
    } else {
      this.#cwd = process.cwd();
      this.#log = console.error;
    }

    if (/lib[\/\\]bs/.exec(this.#cwd)) {
      this.#cwd = resolve(this.#cwd, "../..");
    }

    this.#ctx = ctx;
  }

  spawn<T extends Platform, U extends unknown[]>(
    ctor: new (ctx: Command, elevated: string | undefined, ...args: U) => T,
    ...args: U
  ): T {
    return new ctor(this.#ctx, this.#elevated ? this.#cwd : undefined, ...args);
  }

  async main() {}

  cwd() {
    return this.#cwd;
  }

  log(message: string) {
    if (!this.#silent) {
      this.#log("> ppx-install " + message);
    }
  }

  logv(verbose: boolean, message: string) {
    if (verbose) {
      this.log(message);
    }
  }

  error(message: string) {
    this.#ctx.error("> ppx-install: " + message);
  }

  fatal(message: string): never {
    for (const file of this.cleanup) {
      removeIfExistsSync(file);
    }
    if (this.#elevated) {
      writeFileSync(
        resolve(this.#cwd, "__ppx_elevated_prompt_error"),
        "> ppx-install: " + message,
      );
    }
    this.#ctx.error("> ppx-install: " + message, { exit: 1 });
  }

  elevated() {
    return this.#elevated;
  }

  async run(options?: RunOptions) {
    if (options?.silent) {
      this.#silent = true;
    }

    if (!options?.shouldElevateInWindows) {
      return this.main();
    }

    if (this.#platform === "win32" && !this.#elevated) {
      this.exec(
        `cscript.exe "${resolve(__dirname, "ppx.vbs")}" "${process.argv[1]}" "${
          options?.arg1 ?? ""
        }" "${this.#cwd}"`,
      );

      const erf = resolve(this.#cwd, "__ppx_elevated_prompt_error");

      if (existsSync(erf)) {
        const error = readFileSync(erf);
        unlinkSync(erf);
        this.fatal(error.toString());
      }

      return;
    }

    if (this.#platform === "win32") {
      this.log(`cwd: ${this.#cwd}`);
      process.chdir(resolve(this.#cwd));
      process.on("unhandledRejection", (reason) => {
        writeFileSync(
          resolve(this.#cwd, "__ppx_elevated_prompt_error"),
          reason,
        );
      });
      process.on("uncaughtException", (error) => {
        writeFileSync(resolve(this.#cwd, "__ppx_elevated_prompt_error"), error);
      });
    }
    try {
      await this.main();
    } finally {
      if (this.#platform === "win32") {
        unlinkSync(resolve(this.#cwd, "__ppx_elevated_prompt.lock"));
      }
    }
  }

  exec(command: string) {
    this.log(`> ${command}`);
    execSync(command, this.#execOptions);
  }

  exec1(pathlike: string[], ...args: string[]) {
    const cmd = `"${resolve(this.#cwd, ...pathlike)}"`;
    this.exec(cmd + " " + args.join(" "));
  }

  async dir(path: string, cmd: () => Promise<void>) {
    const cwd = process.cwd();
    try {
      this.log(`] Platform.dir: current: ${cwd}, next: ${path}`);
      process.chdir(path);
      this.log(`] Platform.dir: cwd: ${process.cwd()}`);
      await cmd();
    } finally {
      this.log(`] Platform.dir: restoring previous cwd...`);
      process.chdir(cwd);
      this.log(`] Platform.dir: cwd: ${process.cwd()}`);
    }
  }

  resolve(...segs: string[]) {
    return resolve(this.#cwd, ...segs);
  }
}
