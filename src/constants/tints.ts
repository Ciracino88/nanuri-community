/**
 * 장식·식별 전용 틴트. **누를 수 있는 것에는 쓰지 않는다** — 그건 액센트 퍼플 담당.
 * 퍼플 계열이 여기 없는 것도 액센트와 충돌하기 때문이다.
 *
 * 색값은 `index.css` 의 `--color-{tint}-subtle|base|strong` 토큰이다.
 * 여기 있는 건 그 토큰을 조합한 **클래스 짝**이다 — 배경만 바꾸고 글자색을 안 바꾸면
 * 틴트 위 대비가 깨지므로 항상 짝으로 쓴다.
 */
export const TINTS = ["teal", "pink", "amber", "info"] as const;

export type Tint = (typeof TINTS)[number];

/** 아이콘 타일: 옅은 배경 + 그 위 아이콘 색. (`ActionRow` 의 48px 타일이 기준) */
export const TINT_TILE: Record<Tint, string> = {
  teal: "bg-teal-subtle text-teal",
  pink: "bg-pink-subtle text-pink",
  amber: "bg-amber-subtle text-amber",
  info: "bg-info-subtle text-info",
};

/** 틴트 배경 위 진한 글자. 번호·라벨처럼 아이콘보다 대비가 필요한 자리에 쓴다. */
export const TINT_STRONG: Record<Tint, string> = {
  teal: "bg-teal-subtle text-teal-strong",
  pink: "bg-pink-subtle text-pink-strong",
  amber: "bg-amber-subtle text-amber-strong",
  info: "bg-info-subtle text-info-strong",
};

// 순번 배정에서 info 를 뺀 이유: info 는 "정보/안내" 의미로도 쓰여서, 순서를 뜻하는
// 자리에 섞이면 그 항목만 특별해 보인다. 장식용 순환은 카테고리 3색으로 충분하다.
const CYCLE: Tint[] = ["teal", "pink", "amber"];

/**
 * 순번 → 틴트. 목록에서 규칙적으로 반복돼 리듬을 만드는 용도다.
 * 항목마다 의미가 있는 색이 아니라 **위치에 따른 장식**이라는 걸 잊지 말 것.
 */
export function tintByIndex(index: number): Tint {
  return CYCLE[index % CYCLE.length];
}
