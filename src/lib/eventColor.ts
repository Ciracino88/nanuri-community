import { TAB_COLORS } from "../constants/theme";

export const EVENT_COLORS = Object.values(TAB_COLORS);

// 행사 id로 안정적인 팔레트 색 하나를 고른다 (리스트·관리자·상세 공통)
export function colorForEvent(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return EVENT_COLORS[h % EVENT_COLORS.length];
}
