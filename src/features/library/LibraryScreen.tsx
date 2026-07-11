import { useEffect, useState } from "react";
import { ImportPreviewModal } from "../../components/ImportPreviewModal";
import { db } from "../../db/db";
import type { EntryRecord, ExerciseRecord, ImportLogRecord, PackRecord } from "../../db/schema";
import { labelForTag } from "../../engine/practiceCategories";
import { exportBackup, restoreBackup } from "../../importExport/exportBackup";
import { exportAuthoringSnapshot } from "../../importExport/exportSnapshot";
import { buildAuthoringPrompt } from "../../importExport/authoringPrompt";
import { copyText } from "../../utils/clipboard";

type LibraryScreenProps = {
  packs: PackRecord[];
  entries: EntryRecord[];
  exercises: ExerciseRecord[];
  importLog: ImportLogRecord[];
};

export function LibraryScreen({ packs, entries, exercises, importLog }: LibraryScreenProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [restoreText, setRestoreText] = useState("");
  const [authoringSnapshotText, setAuthoringSnapshotText] = useState("");
  const [updatePrompt, setUpdatePrompt] = useState("");
  const [manualCopyText, setManualCopyText] = useState("");

  useEffect(() => {
    let active = true;
    exportAuthoringSnapshot(db)
      .then((snapshot) => {
        if (!active) return;
        setAuthoringSnapshotText(JSON.stringify(snapshot, null, 2));
        setUpdatePrompt(buildAuthoringPrompt(snapshot));
      })
      .catch((error: unknown) => {
        if (active) setStatus(error instanceof Error ? error.message : "Could not prepare the update prompt.");
      });
    return () => {
      active = false;
    };
  }, [entries, exercises, packs]);

  async function downloadBackup() {
    const backup = await exportBackup(db);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kuiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Full backup exported.");
  }

  async function copySnapshot() {
    if (!authoringSnapshotText) return;
    const copied = await copyText(authoringSnapshotText);
    setManualCopyText(copied ? "" : authoringSnapshotText);
    setStatus(copied ? "Authoring snapshot copied." : "Automatic copy was blocked. Use the manual copy box below.");
  }

  async function copyUpdatePrompt() {
    if (!updatePrompt) return;
    const copied = await copyText(updatePrompt);
    setManualCopyText(copied ? "" : updatePrompt);
    setStatus(
      copied
        ? `ChatGPT update prompt copied (${updatePrompt.length.toLocaleString()} characters).`
        : "Automatic copy was blocked. Use the manual copy box below.",
    );
  }

  async function restore() {
    const parsed = JSON.parse(restoreText);
    await restoreBackup(db, parsed);
    setRestoreText("");
    setStatus("Backup restored.");
  }

  return (
    <section className="stack">
      <div className="screen-heading">
        <p className="eyebrow">Content and data</p>
        <h1>Library</h1>
      </div>
      <div className="button-row">
        <button type="button" className="primary-button" onClick={() => setImportOpen(true)}>
          Paste JSON update
        </button>
        <button type="button" className="secondary-button" onClick={downloadBackup}>
          Export backup
        </button>
        <button type="button" className="secondary-button" disabled={!authoringSnapshotText} onClick={copySnapshot}>
          Copy authoring snapshot
        </button>
        <button type="button" className="secondary-button" disabled={!updatePrompt} onClick={copyUpdatePrompt}>
          Copy ChatGPT update prompt
        </button>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      {manualCopyText ? (
        <section className="plain-section" aria-label="Manual copy fallback">
          <h2>Manual copy</h2>
          <p>Select all of the text below and copy it.</p>
          <textarea className="json-input small" readOnly value={manualCopyText} onFocus={(event) => event.currentTarget.select()} />
          <button type="button" className="text-button" onClick={() => setManualCopyText("")}>
            Hide
          </button>
        </section>
      ) : null}
      <div className="stats-grid">
        <div className="stat-card">
          <strong>{packs.length}</strong>
          <span>packs</span>
        </div>
        <div className="stat-card">
          <strong>{entries.length}</strong>
          <span>entries</span>
        </div>
        <div className="stat-card">
          <strong>{exercises.length}</strong>
          <span>exercises</span>
        </div>
      </div>
      <section className="plain-section">
        <h2>Add future lessons</h2>
        <ol className="numbered-list">
          <li>Copy the ChatGPT update prompt.</li>
          <li>Paste it into chat with your new lesson notes, screenshots, PDF text, or worksheet material.</li>
          <li>Attach the complete lesson and let the prompt require visual review of printed and handwritten notes.</li>
          <li>Paste the returned JSON, including a fenced JSON response if chat added one, into Paste JSON update.</li>
          <li>Preview the import counts before confirming the merge.</li>
        </ol>
      </section>
      <section className="plain-section">
        <h2>Installed packs</h2>
        <div className="reference-list">
          {packs.map((pack) => (
            <article className="reference-item" key={pack.packId}>
              <h3>{pack.title}</h3>
              <p>
                {pack.packId} · v{pack.version}
              </p>
              <div className="tag-wrap">
                {pack.includes.map((tag) => (
                  <span className="tag" key={tag}>
                    {labelForTag(tag)}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="plain-section">
        <h2>Restore backup</h2>
        <textarea
          className="json-input small"
          value={restoreText}
          onChange={(event) => setRestoreText(event.target.value)}
          placeholder="Paste kuiz-backup@1 JSON"
        />
        <button type="button" className="secondary-button" disabled={!restoreText.trim()} onClick={restore}>
          Restore backup
        </button>
      </section>
      <section className="plain-section">
        <h2>Import history</h2>
        {importLog.slice(-5).map((log) => (
          <p key={log.id}>
            {log.packId}: {log.creates} creates, {log.skips} skips
          </p>
        ))}
      </section>
      <ImportPreviewModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(summary) =>
          setStatus(
            `${summary.title}: ${summary.creates.length} creates, ${summary.updates.length} updates, ${summary.skips.length} skips.`,
          )
        }
      />
    </section>
  );
}
