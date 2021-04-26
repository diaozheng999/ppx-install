import { readdirSync } from "fs";
import { resolve } from "path";
import { Platform } from "./platform";
import { Package } from "./spec";

interface PnpPackageInformation {
  packageLocation: string;
  packageDependencies: Map<string, string>;
}

interface PnpPackageResolutionRequest {
  name: string;
  reference: string;
}

interface Pnp {
  topLevel: PnpPackageResolutionRequest;
  getPackageInformation: (
    request: PnpPackageResolutionRequest,
  ) => PnpPackageInformation;
}

export function getPackageNames(ctx: Platform, deps: Package[]) {
  const pnp: Pnp = require(resolve(process.cwd(), "_esy", "default", "pnp.js"));
  const { packageDependencies } = pnp.getPackageInformation(pnp.topLevel);

  const packageNames: string[] = [];

  for (const { name } of deps) {
    const reference = packageDependencies.get(name);
    if (!reference) {
      ctx.fatal(`Dependency ${name} could not be found.`);
    }
    const info = pnp.getPackageInformation({ name, reference });

    let found = false;

    for (const item of readdirSync(info.packageLocation)) {
      if (item.endsWith(".opam")) {
        found = true;
        const packageName = item.replace(".opam", "");
        ctx.log(`"${name}" => "${packageName}"`);
        packageNames.push(packageName);
        break;
      }
    }

    if (!found) {
      ctx.fatal(`Could not find .opam file for ${name}`);
    }
  }
  return packageNames;
}
