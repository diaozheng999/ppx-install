import Command from "@oclif/command";
import { execSync, ExecSyncOptions } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { resolve } from "path";

interface RunOptions {
  shouldElevateInWindows?: boolean;
  arg1?: string;
}

export class Platform {
  #platform = process.platform;
  #elevated = false;
  #cwd: string;

  #log: (message: string) => void;
  #execOptions: ExecSyncOptions;

  #ctx: Command;

  cleanup: string[] = [];

  constructor(ctx: Command, elevated?: string) {
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
    this.#log(message);
  }

  error(message: string) {
    this.#ctx.error(message);
  }

  fatal(message: string): never {
    for (const file of this.cleanup) {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    }
    this.#ctx.error(message, { exit: 1 });
  }

  elevated() {
    return this.#elevated;
  }

  async run(options?: RunOptions) {
    if (!options?.shouldElevateInWindows) {
      return this.main();
    }

    if (this.#platform === "win32" && !this.#elevated) {
      this.exec(
        `cscript.exe "${resolve(__dirname, "ppx.vbs")}" "${process.argv[1]}" "${
          options?.arg1 ?? ""
        }" "${this.#cwd}"`,
      );
      return;
    }

    if (this.#platform === "win32") {
      this.log(`cwd: ${this.#cwd}`);
      process.chdir(resolve(this.#cwd));
    }
    try {
      await this.main();
    } finally {
      if (this.#platform === "win32") {
        unlinkSync("__ppx_elevated_prompt.lock");
      }
    }
  }

  exec(command: string) {
    this.#log(`> ${command}`);
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
}
