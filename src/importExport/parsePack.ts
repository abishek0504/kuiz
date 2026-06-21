import { ZodError } from "zod";
import { ContentPackSchema, type ContentPack } from "../schemas/contentPack";
import { validateContentQuality } from "./quality";

export type ParsePackResult =
  | {
      ok: true;
      pack: ContentPack;
    }
  | {
      ok: false;
      errors: string[];
    };

export function parsePack(raw: string): ParsePackResult {
  try {
    const parsedJson = JSON.parse(raw);
    const pack = ContentPackSchema.parse(parsedJson);
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
