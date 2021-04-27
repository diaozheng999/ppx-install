import { existsSync, readdirSync, unlinkSync } from "fs";
import { resolve } from "path";

export function removeIfExistsSync(file: string) {
  if (existsSync(file)) {
    unlinkSync(file);
  }
}

export function removeAllIfExists(
  folder: string,
  test: (filename: string) => boolean,
) {
  for (const item of readdirSync(folder)) {
    if (test(item)) {
      unlinkSync(resolve(folder, item));
    }
  }
}
