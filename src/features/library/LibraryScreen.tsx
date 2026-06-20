import { useState } from "react";
import { ImportPreviewModal } from "../../components/ImportPreviewModal";
import { db } from "../../db/db";
import type { EntryRecord, ExerciseRecord, ImportLogRecord, PackRecord } from "../../db/schema";
import { exportBackup, restoreBackup } from "../../importExport/exportBackup";
import { exportAuthoringSnapshot } from "../../importExport/exportSnapshot";
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
    const snapshot = await exportAuthoringSnapshot(db);
    const copied = await copyText(JSON.stringify(snapshot, null, 2));
    setStatus(copied ? "Authoring snapshot copied." : JSON.stringify(snapshot));
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
        <button type="button" className="secondary-button" onClick={copySnapshot}>
          Copy authoring snapshot
        </button>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
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
                    {tag}
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
          placeholder="Paste ace-backup@1 JSON"
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
