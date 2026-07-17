// Tailwind 클래스를 못 쓰는 자리(인라인 style, SVG fill)에서만 쓰는 상수.
// 클래스를 쓸 수 있으면 토큰(text-primary-normal 등)을 쓰는 게 맞다.

/** 상호작용 = 원티드 Primary. 앱 전체에서 "누를 수 있음"을 뜻하는 유일한 색이다.
 *  (버튼·활성 탭·선택 상태·링크). Tailwind 대응 토큰은 `--color-primary-normal`. */
export const ACCENT = "#0066ff";

/** 비활성·보조 (탭바 캐릭터, 라벨). 원티드 `Fill/Normal`(`--color-fill-normal`)과 같은 값. */
export const MUTED = "#70737c";

// 카테고리 색(TINT_COLORS/TAB_COLORS)은 없앴다. 원티드에는 카테고리 팔레트가 없고
// 액센트도 violet/cyan 둘뿐이라, 항목마다 색을 돌리면 원티드 인상이 깨진다.
// 아이콘 타일은 status-bg-active(연파랑) 하나로 통일한다. (docs/design.md)
