import { Command, flags } from "@oclif/command";
import { Clean } from "./clean";
import { PpxBuilderSingleton } from "./ppx-builder-singleton";
import { PpxCachedRunner } from "./ppx-cached-runner";

class PpxInstall extends Command {
  static description =
    "Easy installation of Esy/OPAM PPX rewriters into ReScript";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    elevated: flags.string({
      helpValue: "cwd",
      description:
        "[Windows only] assumes command is executed in Admin prompt with [cwd] as working directory",
    }),
    build: flags.boolean({
      description: "install the Esy project based on specifications",
    }),
    clean: flags.boolean({
      char: "c",
      description: "removes _ppx directory",
    }),
  };

  static args = [{ name: "input" }, { name: "output" }];

  async run() {
    const { flags, args } = this.parse(PpxInstall);

    if (flags.clean) {
      await new Clean(this, flags.elevated).run();
    } else if (flags.build) {
      await new PpxBuilderSingleton(this, flags.elevated).run();
    } else {
      await new PpxCachedRunner(
        this,
        flags.elevated,
        args.input,
        args.output,
      ).run({ silent: true });
    }
  }
}

export = PpxInstall;
