import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "../components/AppShell";
import { db, getSettings, saveSettings } from "../db/db";
import { defaultSettings, type UserSettings } from "../db/schema";
import type { MainTab } from "../engine/tabs";
import { GrammarScreen } from "../features/grammar/GrammarScreen";
import { HomeScreen } from "../features/home/HomeScreen";
import { LibraryScreen } from "../features/library/LibraryScreen";
import { ProgressScreen } from "../features/progress/ProgressScreen";
import { QuizScreen } from "../features/quiz/QuizScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { loadStarterPack } from "../seed/loadStarterPack";

export function App() {
  const [tab, setTab] = useState<MainTab>("home");
  const [bootError, setBootError] = useState("");
  const packs = useLiveQuery(() => db.packs.toArray(), [], []);
  const entries = useLiveQuery(() => db.entries.toArray(), [], []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const reviewStates = useLiveQuery(() => db.reviewState.toArray(), [], []);
  const importLog = useLiveQuery(() => db.importLog.toArray(), [], []);
  const liveSettings = useLiveQuery(() => getSettings(db), [], defaultSettings);
  const settings = liveSettings ?? defaultSettings;

  useEffect(() => {
    loadStarterPack(db).catch((error) => {
      setBootError(error instanceof Error ? error.message : "Could not load starter pack.");
    });
  }, []);

  async function updateSettings(patch: Partial<UserSettings>) {
    await saveSettings(patch, db);
  }

  function renderScreen() {
    if (bootError) {
      return <div className="error-box">{bootError}</div>;
    }

    if (tab === "home") {
      return <HomeScreen packs={packs} entries={entries} exercises={exercises} onStartQuiz={() => setTab("quiz")} />;
    }
    if (tab === "quiz") {
      return <QuizScreen exercises={exercises} settings={settings} onSettingsChange={updateSettings} />;
    }
    if (tab === "grammar") {
      return <GrammarScreen entries={entries} />;
    }
    if (tab === "library") {
      return <LibraryScreen packs={packs} entries={entries} exercises={exercises} importLog={importLog} />;
    }
    if (tab === "progress") {
      return <ProgressScreen exercises={exercises} reviewStates={reviewStates} />;
    }
    return <SettingsScreen settings={settings} onSettingsChange={updateSettings} />;
  }

  return (
    <AppShell currentTab={tab} onTabChange={setTab}>
      {renderScreen()}
    </AppShell>
  );
}
