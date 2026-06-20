import { Volume2 } from "lucide-react";
import type { UserSettings } from "../db/schema";
import { speakKorean } from "../utils/speech";

type AudioButtonProps = {
  text?: string;
  settings: UserSettings;
  label?: string;
};

export function AudioButton({ text, settings, label = "Listen" }: AudioButtonProps) {
  return (
    <button type="button" className="secondary-button" disabled={!text} onClick={() => speakKorean(text, settings)}>
      <Volume2 size={17} aria-hidden="true" />
      {label}
    </button>
  );
}
