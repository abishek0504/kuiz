import { ZodError } from "zod";
import { ContentPackSchema, type ContentPack } from "../schemas/contentPack";
import { validateContentQuality } from "./quality";
import { appVersion, compareVersions } from "../appVersion";

export type ParsePackResult =
  | {
      ok: true;
      pack: ContentPack;
    }
  | {
      ok: false;
      errors: string[];
    };

export function normalizePackJsonInput(raw: string): string {
  const withoutBom = raw.replace(/^\uFEFF/u, "").trim();
  const fenced = withoutBom.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/iu);
  return (fenced?.[1] ?? withoutBom).trim();
}

export function parsePack(raw: string): ParsePackResult {
  try {
    const parsedJson = JSON.parse(normalizePackJsonInput(raw));
    const pack = ContentPackSchema.parse(parsedJson);
    const minimumComparison = compareVersions(pack.pack.appMinVersion, appVersion);
    if (minimumComparison === undefined) {
      return { ok: false, errors: [`pack.appMinVersion: expected semantic version, received ${pack.pack.appMinVersion}.`] };
    }
    if (minimumComparison > 0) {
      return {
        ok: false,
        errors: [`This pack requires Kuiz ${pack.pack.appMinVersion} or newer. Update the app before importing it.`],
      };
    }
    const qualityErrors = validateContentQuality(pack);
    if (qualityErrors.length > 0) {
      return { ok: false, errors: qualityErrors };
    }
    return { ok: true, pack };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        errors: error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`),
      };
    }
    if (error instanceof Error) {
      return { ok: false, errors: [error.message] };
    }
    return { ok: false, errors: ["Unknown parse error."] };
  }
}
