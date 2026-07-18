// 소모임 본문 자동 생성 (Claude). Claude 키는 프론트에 두면 안 되므로 여기서 호출한다.
// Worker 대신 Edge Function 을 쓰는 이유: 호출자의 Supabase 세션을 이 자리에서 바로
// 검증할 수 있어 "로그인한 사용자만" 게이팅이 native 로 붙는다.
//
// 출력은 마커-라이트 문자열이며 그대로 gatherings.description 에 저장돼
// 프론트의 parseDescription / DescriptionBody 가 컴포넌트로 렌더한다.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // supabase-js 는 authorization·apikey 외에 x-client-info·x-supabase-api-version 을
  // 붙여 보낸다. 프리플라이트에서 막히지 않도록 표준 세트를 전부 허용한다.
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 로그인한 사용자만 — Authorization 헤더의 세션을 검증한다. verify_jwt(플랫폼)이
  // 1차로 막고, 여기서 실제 user 존재까지 확인해 anon 키만 든 호출을 걸러낸다.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "인증이 필요합니다" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "인증이 필요합니다" }, 401);

  try {
    const { kind, title, category, whenText, place, seed } = await req.json();
    if (!title || !String(title).trim()) {
      return json({ error: "제목이 필요합니다" }, 400);
    }

    const isChallenge = kind === "challenge";

    // 마커 사전만 쓰도록 강제한다 — 결과 문자열이 그대로 description 에 저장되고
    // 프론트의 parseDescription 이 이 마커로 컴포넌트를 만든다.
    const system = [
      "너는 교회 청년부 소모임 공지 본문을 쓰는 사람이다.",
      "아래 마커만 사용해 본문을 작성한다. 다른 마크다운(**, ##, 1. 등)이나 HTML은 절대 쓰지 않는다.",
      "  # 텍스트  → 섹션 제목 (한 줄)",
      "  > 텍스트  → 강조 인용 한 줄 (도입 후킹용, 0~1개)",
      '  ❓ 질문   → FAQ 질문. 바로 다음 줄에 반드시 "💬 답변"을 붙인다.',
      "  💬 답변   → 위 질문의 답",
      "  - 항목    → 목록 (준비물·순서 등)",
      "  그 외 줄  → 일반 문단",
      "규칙:",
      "- 전체 6~12줄 이내로 짧게. 마커용 이모지 외에 다른 이모지는 쓰지 않는다.",
      "- 따뜻하고 담백한 말투. 문장을 짧게 끊어도 좋다.",
      isChallenge
        ? "- 이 모임은 기한 없이 계속되는 챌린지다. 무엇을 함께 이어가는지 중심의 여정 톤으로 쓰고, 모이는 '시각'은 언급하지 않는다."
        : "- 이 모임은 한 번 모이고 끝나는 원데이다. 언제·어디서 모여 무엇을 하는지 중심의 초대장 톤으로 쓰고, 주어진 시각을 자연스럽게 녹인다.",
      "- 주어진 값만 쓴다. 사실을 지어내지 않는다. 값이 없는 항목은 생략한다.",
      "- 작성자 메모가 있으면 그 의도를 살려 확장한다.",
      "출력은 본문 텍스트만. 설명·머리말·코드펜스 없이.",
    ].join("\n");

    const facts = [
      `성격: ${isChallenge ? "챌린지(기한 없이 계속)" : "원데이(한 번 모임)"}`,
      `제목: ${String(title).trim()}`,
      category ? `분류: ${category}` : null,
      !isChallenge && whenText ? `일시: ${whenText}` : null,
      place ? `장소: ${place}` : null,
      seed ? `작성자 메모: ${seed}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // 스트리밍으로 받는다 — 클라이언트에서 실시간 타이핑 연출을 하려면 델타가 필요하다.
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        stream: true,
        system,
        messages: [{ role: "user", content: facts }],
      }),
    });

    if (!claudeRes.ok || !claudeRes.body) {
      const body = claudeRes.body ? await claudeRes.text() : "";
      return json({ error: "생성 실패", status: claudeRes.status, body }, 502);
    }

    // Claude SSE 를 파싱해 text_delta 텍스트만 뽑아 plain text 로 흘려보낸다.
    // 클라이언트는 이 조각들을 그대로 이어 붙여 화면에 타이핑한다.
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = claudeRes.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload) continue;
              try {
                const evt = JSON.parse(payload);
                if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                  controller.enqueue(encoder.encode(evt.delta.text));
                }
              } catch {
                // 조각난 JSON 라인은 다음 청크에서 이어진다 — 무시
              }
            }
          }
        } catch (_e) {
          // 클라이언트 연결 종료 등 — 스트림만 닫는다
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return json({ error: (err as Error)?.message ?? String(err) }, 500);
  }
});
