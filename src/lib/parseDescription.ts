// 소모임 본문(description)은 DB에서 단일 문자열 칸이다. 그 안에 "마커-라이트" 방언을
// 담고, 여기서 블록 배열로 파싱해 화면이 컴포넌트로 렌더한다.
//
// 마커 사전은 작다 — 사람이 손으로 쳐도 되고, Claude 생성분도 이 어휘만 쓴다.
//   # 텍스트        → 섹션 제목
//   > 텍스트        → 강조 인용(후킹)
//   ❓ 질문 / 💬 답변 → FAQ 한 쌍
//   - 항목          → 목록(연속 줄이 한 블록)
//   그 외           → 문단(마커 없는 기존 통짜 글도 전부 이걸로 떨어진다)
//
// 마커가 하나도 없으면 결과는 문단 블록 하나 — 즉 기존 whitespace-pre-wrap 과 같은 모양이라
// 하위 호환이 유지된다.

export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "quote"; text: string }
  | { type: "faq"; question: string; answer: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

const Q_MARK = "❓";
const A_MARK = "💬";

export function parseDescription(raw: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  // 문단은 여러 줄을 모아 한 블록으로 만든다(시적 줄바꿈 보존). 빈 줄이 경계다.
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 빈 줄 — 문단 경계
    if (trimmed === "") {
      flushParagraph();
      continue;
    }

    // # 제목
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "heading", text: trimmed.slice(2).trim() });
      continue;
    }

    // > 인용
    if (trimmed.startsWith("> ")) {
      flushParagraph();
      blocks.push({ type: "quote", text: trimmed.slice(2).trim() });
      continue;
    }

    // ❓ 질문 → 바로 뒤 💬 답변을 짝짓는다(답변 줄이 없으면 빈 답변)
    if (trimmed.startsWith(Q_MARK)) {
      flushParagraph();
      const question = trimmed.slice(Q_MARK.length).trim();
      let answer = "";
      const nextTrimmed = lines[i + 1]?.trim() ?? "";
      if (nextTrimmed.startsWith(A_MARK)) {
        answer = nextTrimmed.slice(A_MARK.length).trim();
        i++; // 답변 줄 소비
      }
      blocks.push({ type: "faq", question, answer });
      continue;
    }

    // - 목록 — 연속된 항목을 한 블록으로 모은다
    if (trimmed.startsWith("- ")) {
      flushParagraph();
      const items: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("- ")) {
        items.push(lines[j].trim().slice(2).trim());
        j++;
      }
      blocks.push({ type: "list", items });
      i = j - 1;
      continue;
    }

    // 그 외 — 문단에 쌓는다
    paragraph.push(trimmed);
  }

  flushParagraph();
  return blocks;
}
