import { resolve } from "path";
import { promisify } from "util";
import { Platform } from "./platform";

const rimraf = promisify(require("rimraf"));

export class Clean extends Platform {
  async main() {
    this.log("removing _ppx folder");
    await rimraf(resolve(this.cwd(), "_ppx"));
  }
}
