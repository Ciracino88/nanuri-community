import { useState } from "react";

const MOODS = [
  { value: 1, icon: "ti-mood-sad", label: "불만족" },
  { value: 2, icon: "ti-mood-empty", label: "평범" },
  { value: 3, icon: "ti-mood-happy", label: "만족" },
] as const;

interface MoodRatingProps {
  value: number;
  onChange: (v: number) => void;
}

export default function MoodRating({ value, onChange }: MoodRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-4">
      {MOODS.map((mood) => {
        const active = hovered === mood.value || (!hovered && value === mood.value);
        return (
          <button
            key={mood.value}
            type="button"
            className="flex flex-col items-center gap-1 transition"
            onMouseEnter={() => setHovered(mood.value)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(mood.value)}
          >
            <i
              className={`ti ${mood.icon} text-3xl transition ${active ? "text-info" : "text-fg-faint"}`}
              aria-hidden="true"
            />
            <span className={`text-caption transition ${active ? "text-info" : "text-fg-faint"}`}>
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
