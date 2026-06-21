import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { ContentPackSchema } from "../src/schemas/contentPack";
import { validateContentQuality } from "../src/importExport/quality";

function expandArg(arg: string): string[] {
  if (!arg.includes("*")) return [arg];
  const folder = dirname(arg);
  const pattern = new RegExp(`^${basename(arg).replace(".", "\\.").replace("*", ".*")}$`);
  return readdirSync(folder)
    .filter((file) => pattern.test(file))
    .map((file) => join(folder, file));
}

const paths = process.argv.slice(2).flatMap(expandArg).filter((path) => statSync(path).isFile());

if (paths.length === 0) {
  throw new Error("No pack files supplied.");
}

for (const path of paths) {
  const parsed = ContentPackSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  const qualityErrors = validateContentQuality(parsed);
  if (qualityErrors.length > 0) {
    throw new Error(`${path} failed quality validation:\n${qualityErrors.join("\n")}`);
  }
  console.log(`${path}: ${parsed.pack.packId} ok (${parsed.exercises.length} exercises)`);
}
