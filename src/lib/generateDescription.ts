import { supabase } from "./supabase";
import type { GatheringKind } from "../types/gathering";

// 소모임 본문 자동 생성 (스트리밍). Claude 키는 프론트에 두면 안 되므로 Supabase Edge
// Function 을 거친다. 실시간 타이핑 연출을 위해 함수가 델타를 흘려보내고, 여기서 조각을
// 이어 붙이며 onDelta 로 넘긴다. 반환값은 완성된 전체 문자열.
//
// functions.invoke 는 스트리밍 응답을 못 다뤄서 함수 URL 을 직접 fetch 한다. verify_jwt
// 게이트를 통과하도록 현재 세션의 access_token 을 Authorization 에 싣는다.
export interface GenerateDescriptionInput {
  kind: GatheringKind;
  title: string;
  /** 해석된 카테고리 "☕️ 카페" (id 아님). 없으면 생략 */
  category?: string | null;
  /** 원데이 일시를 사람이 읽는 문구로. 챌린지면 넘기지 않는다 */
  whenText?: string | null;
  place?: string | null;
  /** 사용자가 이미 써 둔 한마디 — 있으면 이 의도를 살려 확장한다 */
  seed?: string | null;
}

export async function generateDescriptionStream(
  input: GenerateDescriptionInput,
  onDelta: (chunk: string) => void
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-description`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${session?.access_token ?? anonKey}`,
      },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok || !res.body) throw new Error("본문 생성 실패");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onDelta(chunk);
    }
  }
  return full;
}
