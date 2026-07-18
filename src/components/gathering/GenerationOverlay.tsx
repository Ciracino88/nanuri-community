import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import Button from "../ui/Button";
import {
  generateDescriptionStream,
  type GenerateDescriptionInput,
} from "../../lib/generateDescription";

// Claude 본문 생성 연출. 화면을 덮는 어두운 풀스크린 오버레이에서 좌상단부터 글자가
// 타이핑되듯 나타난다. 스트리밍으로 받은 텍스트를 ref 에 쌓고, 타자기 인터벌이 그걸
// 조금씩 따라가며 보여준다(네트워크가 큰 덩어리로 와도 부드럽게 타이핑돼 보이게).
//
// 하단 확인 → onConfirm(text) 로 본문 입력창에 넣는다. 취소 → onCancel.
export default function GenerationOverlay({
  input,
  onConfirm,
  onCancel,
}: {
  input: GenerateDescriptionInput;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}) {
  const receivedRef = useRef(""); // 스트리밍으로 받은 전체 텍스트
  const streamDoneRef = useRef(false);
  const [shown, setShown] = useState(""); // 화면에 타이핑된 만큼
  const [done, setDone] = useState(false); // 스트림 끝 + 타이핑 따라잡음
  const [error, setError] = useState(false);

  // 스트리밍 수신 — 마운트 시 한 번. input 은 열릴 때 고정된 값이 넘어온다.
  useEffect(() => {
    let cancelled = false;
    receivedRef.current = "";
    streamDoneRef.current = false;
    generateDescriptionStream(input, (chunk) => {
      if (!cancelled) receivedRef.current += chunk;
    })
      .then(() => {
        streamDoneRef.current = true;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 타자기 연출 — 받은 만큼을 2글자씩 따라간다. 스트림이 끝나고 다 따라잡으면 done.
  useEffect(() => {
    const id = setInterval(() => {
      const target = receivedRef.current;
      setShown((cur) => {
        if (cur.length >= target.length) {
          if (streamDoneRef.current && target.length > 0) setDone(true);
          return cur;
        }
        return target.slice(0, cur.length + 2);
      });
    }, 24);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* 타이핑 영역 — 좌상단부터 채운다 */}
      <div className="flex-1 overflow-y-auto px-6 pt-14">
        <p className="text-caption1 font-medium text-white/40 mb-4">
          {error ? "생성 실패" : done ? "다 썼어요" : "Claude가 본문을 쓰고 있어요"}
        </p>
        {error ? (
          <p className="text-body1 text-white/70">
            본문을 만들지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-body1 leading-relaxed text-white/90">
            {shown}
            {!done && <span className="animate-pulse">▍</span>}
          </pre>
        )}
      </div>

      {/* 하단 버튼 — 확인은 타이핑이 끝나야 활성화 */}
      <div
        className="px-4 pt-3 flex gap-2"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 flex items-center justify-center gap-1.5 px-4 rounded-field border border-white/20 text-label1 font-medium text-white/70 active:scale-95 transition"
        >
          <X size={16} />
          취소
        </button>
        <div className="flex-1">
          <Button
            type="button"
            onClick={() => onConfirm(receivedRef.current)}
            disabled={!done || error}
          >
            <span className="flex items-center justify-center gap-2">
              <Check size={18} />
              이 본문 쓰기
            </span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
