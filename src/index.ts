import { Command, flags } from "@oclif/command";
import { EsyInstall } from "./esy-install";
import { parse } from "./spec";

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
  };

  async run() {
    const { flags } = this.parse(PpxInstall);

    parse();

    new EsyInstall(flags.elevated).run(process.argv[1]);
  }
}

export = PpxInstall;
