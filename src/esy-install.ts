import { Platform } from "./platform";

export class EsyInstall extends Platform {
  main() {
    this.exec("echo hi");
  }
}
