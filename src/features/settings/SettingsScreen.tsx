import { useEffect, useMemo, useState } from "react";
import type { UserSettings } from "../../db/schema";
import { getVoices, type VoiceOption } from "../../utils/speech";
import { requestStoragePersistence } from "../../utils/storagePersistence";

type SettingsScreenProps = {
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
};

export function SettingsScreen({ settings, onSettingsChange }: SettingsScreenProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [persistence, setPersistence] = useState<string>("");

  useEffect(() => {
    function refreshVoices() {
      setVoices(getVoices());
    }
    refreshVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const orderedVoices = useMemo(
    () => [...voices].sort((a, b) => Number(!a.lang.startsWith("ko")) - Number(!b.lang.startsWith("ko"))),
    [voices],
  );

  async function persistStorage() {
    const result = await requestStoragePersistence();
    setPersistence(`Storage persistence: ${result}.`);
  }

  return (
    <section className="stack">
      <div className="screen-heading">
        <p className="eyebrow">Preferences</p>
        <h1>Settings</h1>
      </div>
      <label className="field-label" htmlFor="particle-coverage">
        Particle coverage
      </label>
      <select
        id="particle-coverage"
        className="select-input"
        value={settings.particleCoverage}
        onChange={(event) => onSettingsChange({ particleCoverage: event.target.value as UserSettings["particleCoverage"] })}
      >
        <option value="all">All particles</option>
        <option value="core">Core particles</option>
      </select>
      <label className="field-label" htmlFor="particle-strictness">
        Answer strictness
      </label>
      <select
        id="particle-strictness"
        className="select-input"
        value={settings.particleStrictness}
        onChange={(event) =>
          onSettingsChange({ particleStrictness: event.target.value as UserSettings["particleStrictness"] })
        }
      >
        <option value="strict">Strict</option>
        <option value="relaxed">Relaxed</option>
      </select>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.autoAudio}
          onChange={(event) => onSettingsChange({ autoAudio: event.target.checked })}
        />
        Auto audio
      </label>
      <label className="field-label" htmlFor="speech-rate">
        Speech rate: {settings.speechRate.toFixed(2)}
      </label>
      <input
        id="speech-rate"
        type="range"
        min="0.75"
        max="1.15"
        step="0.05"
        value={settings.speechRate}
        onChange={(event) => onSettingsChange({ speechRate: Number(event.target.value) })}
      />
      <label className="field-label" htmlFor="voice-uri">
        Voice
      </label>
      <select
        id="voice-uri"
        className="select-input"
        value={settings.voiceURI ?? ""}
        onChange={(event) => onSettingsChange({ voiceURI: event.target.value || undefined })}
      >
        <option value="">Best Korean voice</option>
        {orderedVoices.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI}>
            {voice.name} ({voice.lang})
          </option>
        ))}
      </select>
      <button type="button" className="secondary-button" onClick={persistStorage}>
        Request storage persistence
      </button>
      {persistence ? <p className="status-line">{persistence}</p> : null}
    </section>
  );
}
