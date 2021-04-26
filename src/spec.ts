import { resolve } from "path";

export function parse() {
  const p = require(resolve(process.cwd(), "package.json"));
  console.log(p);
}
