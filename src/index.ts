import { Command, flags } from "@oclif/command";
import { PpxBuilderSingleton } from "./ppx-builder-singleton";
import { PpxCachedRunner } from "./ppx-cached-runner";

class PpxInstall extends Command {
  static description = "P";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    elevated: flags.string({
      description:
        "[Windows only] flags command to be run in Administrator command prompt",
    }),
    install: flags.boolean({
      description: "install the Esy project based on specifications",
    }),
  };

  static args = [{ name: "input" }, { name: "output" }];

  async run() {
    const { flags, args } = this.parse(PpxInstall);

    if (flags.install) {
      await new PpxBuilderSingleton(this, flags.elevated).run();
    } else {
      await new PpxCachedRunner(
        this,
        flags.elevated,
        args.input,
        args.output,
      ).run();
    }
  }
}

export = PpxInstall;
