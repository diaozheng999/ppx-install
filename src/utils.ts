import { existsSync, readdirSync, unlinkSync } from "fs";
import { resolve } from "path";
import { promisify } from "util";

const rimraf: (path: string) => Promise<void> = promisify(require("rimraf"));

export function removeIfExistsSync(file: string) {
  if (existsSync(file)) {
    unlinkSync(file);
  }
}

export function removeAllIfExists(
  folder: string,
  test: (filename: string) => boolean,
) {
  const toRemove = [];

  for (const item of readdirSync(folder)) {
    console.log("look", item);
    if (test(item)) {
      toRemove.push(resolve(folder, item));
    }
  }

  console.log("remove", toRemove);

  return Promise.all(toRemove.map((p) => rimraf(p)));
}
