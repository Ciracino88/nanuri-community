import { parseDescription } from "../../lib/parseDescription";

// 소모임 본문 렌더러. description 문자열을 마커 블록으로 파싱해 디자인 토큰으로 그린다.
// 마커가 없는 기존 통짜 글은 문단 하나로 떨어져 예전과 같은 모양이 된다(하위 호환).
//
// 색·타이포는 상세 화면 본문 기준(text-body1-reading / text-label-normal)을 따른다.
export default function DescriptionBody({ text }: { text: string }) {
  const blocks = parseDescription(text);

  // 간격은 원티드 상세 본문 리듬에 맞춘다: 본문 16px/행간 1.625(토큰과 동일),
  // 문단 사이 16px(gap-4), 섹션(제목) 앞 24px(gap 16 + 제목 mt-2 8). 제목은 원티드
  // 섹션 제목(18/SemiBold)에 스케일 내 가장 가까운 headline2(17)+SemiBold 로.
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            // 본문 안 섹션 제목. 첫 블록이 아니면 위로 띄워 섹션 구획을 만든다.
            return (
              <h3
                key={i}
                className={`text-headline2 font-semibold text-label-normal ${i > 0 ? "mt-2" : ""}`}
              >
                {block.text}
              </h3>
            );

          case "quote":
            // 후킹/인용 — 좌측 액센트 바 콜아웃.
            return (
              <p
                key={i}
                className="border-l-2 border-primary-normal pl-3 text-body1-reading text-label-neutral whitespace-pre-line"
              >
                {block.text}
              </p>
            );

          case "faq":
            return (
              <div key={i} className="rounded-field bg-bg-alternative px-3.5 py-3">
                <p className="text-label1 font-semibold text-label-normal">
                  <span aria-hidden className="mr-1">❓</span>
                  {block.question}
                </p>
                {block.answer && (
                  <p className="mt-1 text-body1-reading text-label-neutral whitespace-pre-line">
                    <span aria-hidden className="mr-1">💬</span>
                    {block.answer}
                  </p>
                )}
              </div>
            );

          case "list":
            return (
              <ul key={i} className="flex flex-col gap-1 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2 text-body1-reading text-label-normal">
                    <span aria-hidden className="text-label-assistive select-none">•</span>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            );

          case "paragraph":
          default:
            return (
              <p
                key={i}
                className="text-body1-reading text-label-normal whitespace-pre-line"
              >
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
