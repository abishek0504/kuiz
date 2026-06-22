import { useMemo, useState } from "react";
import { db } from "../db/db";
import { parsePack } from "../importExport/parsePack";
import { mergeContentPack, previewContentPack, type ImportPreview } from "../importExport/mergePack";
import { labelForTag } from "../engine/practiceCategories";
import type { ContentPack } from "../schemas/contentPack";
import { copyText } from "../utils/clipboard";

type ImportPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  onImported: (summary: ImportPreview) => void;
};

export function ImportPreviewModal({ open, onClose, onImported }: ImportPreviewModalProps) {
  const [raw, setRaw] = useState("");
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const canConfirm = useMemo(() => Boolean(pack && preview && preview.conflicts.length === 0), [pack, preview]);
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const exercise of pack?.exercises ?? []) {
      counts.set(labelForTag(exercise.type), (counts.get(labelForTag(exercise.type)) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [pack]);
  const laneCounts = useMemo(() => {
    const lanes = new Map<string, number>();
    for (const exercise of pack?.exercises ?? []) {
      for (const tag of exercise.tags) {
        if (["vocab", "number", "numbers", "grammar", "particles", "connectors", "mixed", "scenario"].includes(tag)) {
          const label = labelForTag(tag);
          lanes.set(label, (lanes.get(label) ?? 0) + 1);
        }
      }
    }
    return [...lanes.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [pack]);

  if (!open) return null;

  async function handlePreview() {
    setBusy(true);
    setErrors([]);
    setPreview(null);
    setPack(null);
    try {
      const parsed = parsePack(raw);
      if (!parsed.ok) {
        setErrors(parsed.errors);
        return;
      }
      const nextPreview = await previewContentPack(db, parsed.pack);
      setPack(parsed.pack);
      setPreview(nextPreview);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!pack || !preview) return;
    setBusy(true);
    try {
      const summary = await mergeContentPack(db, pack, preview);
      onImported(summary);
      setRaw("");
      setPack(null);
      setPreview(null);
      onClose();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Import failed."]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Import content pack">
      <section className="modal">
        <div className="modal-header">
          <h2>Paste JSON update</h2>
          <button type="button" className="text-button" onClick={onClose}>
            Close
          </button>
        </div>
        <label className="field-label" htmlFor="import-json">
          Content pack JSON
        </label>
        <textarea
          id="import-json"
          className="json-input"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          spellCheck={false}
        />
        {errors.length > 0 ? (
          <div className="error-box">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
            <button type="button" className="secondary-button" onClick={() => void copyText(errors.join("\n"))}>
              Copy errors
            </button>
          </div>
        ) : null}
        {preview ? (
          <>
            <div className="preview-grid" data-testid="import-preview">
              <div>
                <strong>{preview.creates.length}</strong>
                <span>creates</span>
              </div>
              <div>
                <strong>{preview.updates.length}</strong>
                <span>updates</span>
              </div>
              <div>
                <strong>{preview.skips.length}</strong>
                <span>skips</span>
              </div>
              <div>
                <strong>{preview.conflicts.length}</strong>
                <span>conflicts</span>
              </div>
            </div>
            <div className="import-detail-grid">
              <section>
                <h3>Exercise types</h3>
                {typeCounts.map(([type, count]) => (
                  <p key={type}>
                    <span>{type}</span>
                    <strong>{count}</strong>
                  </p>
                ))}
              </section>
              <section>
                <h3>Major lanes</h3>
                {laneCounts.map(([lane, count]) => (
                  <p key={lane}>
                    <span>{lane}</span>
                    <strong>{count}</strong>
                  </p>
                ))}
              </section>
            </div>
            <div className="import-conflict-table">
              {(["updates", "skips", "conflicts"] as const).map((kind) =>
                preview[kind].length > 0 ? (
                  <section key={kind}>
                    <h3>{kind}</h3>
                    {preview[kind].slice(0, 6).map((key) => (
                      <code key={key}>{key}</code>
                    ))}
                  </section>
                ) : null,
              )}
            </div>
          </>
        ) : null}
        <div className="button-row">
          <button type="button" className="primary-button" disabled={busy || raw.trim().length === 0} onClick={handlePreview}>
            Preview import
          </button>
          <button type="button" className="primary-button" disabled={busy || !canConfirm} onClick={handleConfirm}>
            Confirm import
          </button>
        </div>
      </section>
    </div>
  );
}
