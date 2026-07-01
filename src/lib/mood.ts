// 만족도(mood) 단일 정의 — 3단계

export interface MoodDef {
  value: number;
  icon: string;
  label: string;
  color: string; // 텍스트/아이콘 색 (Tailwind)
  bar: string;   // 막대 배경색 (Tailwind)
}

export const MOODS: MoodDef[] = [
  { value: 1, icon: "ti-mood-sad", label: "불만족", color: "text-danger", bar: "bg-danger" },
  { value: 2, icon: "ti-mood-empty", label: "평범", color: "text-warning", bar: "bg-warning" },
  { value: 3, icon: "ti-mood-happy", label: "만족", color: "text-success", bar: "bg-success" },
];

export const MOOD_BY_VALUE: Record<number, MoodDef> = Object.fromEntries(MOODS.map((m) => [m.value, m]));

export interface MoodBucket extends MoodDef {
  count: number;
  pct: number;
}

/** 평가 목록을 mood 단계별 카운트/비율로 집계 (total = 전체 평가 수) */
export function aggregateMoods(evals: { mood: number | null }[]): { total: number; buckets: MoodBucket[] } {
  const total = evals.length;
  const buckets = MOODS.map((m) => {
    const count = evals.filter((e) => e.mood === m.value).length;
    return { ...m, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
  return { total, buckets };
}
