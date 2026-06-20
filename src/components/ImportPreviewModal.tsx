import { useMemo, useState } from "react";
import { db } from "../db/db";
import { parsePack } from "../importExport/parsePack";
import { mergeContentPack, previewContentPack, type ImportPreview } from "../importExport/mergePack";
import type { ContentPack } from "../schemas/contentPack";

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
          </div>
        ) : null}
        {preview ? (
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
