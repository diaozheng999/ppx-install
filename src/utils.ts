import { execSync } from "child_process";
import { unlinkSync } from "fs";
import { resolve } from "path";

export type PlatformResolution = ReturnType<typeof resolvePlatform>;

export function exec(f: string) {
  console.log(">", f);
  execSync(f, {
    stdio: "inherit",
  });
}

export function resolvePlatform() {
  if (process.platform === "win32") {
    const elevated = process.argv[2] === "-elevated";
    return {
      platform: "win32" as const,
      elevated,
      cwd: elevated ? process.argv[3] : process.cwd(),
    };
  }
  return { platform: process.platform };
}

export function elevateInWindows(
  f: () => void,
  ctx: PlatformResolution,
  reason?: string,
) {
  if (ctx.platform === "win32" && !ctx.elevated) {
    if (reason) {
      console.log(reason);
    }
    exec(`cscript.exe "${resolve(__dirname, "ppx.vbs")}"`);
  } else {
    if (ctx.platform === "win32") {
      process.chdir(resolve(ctx.cwd));
    }
    f();
    if (ctx.platform === "win32") {
      unlinkSync("__esy_elevated_prompt.lock");
    }
  }
}
