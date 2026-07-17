import type { ReactNode } from "react";
import { motion } from "motion/react";
import { CalendarDays, Image as ImageIcon } from "lucide-react";
import BackButton from "./BackButton";
import { computeEventStatus, type EventStatus } from "../lib/eventStatus";
import { ACCENT } from "../constants/theme";
import type { EventRecord } from "../types/event";

const STATUS_META: Record<EventStatus, { label: string; text: string }> = {
  upcoming: { label: "예정", text: "#4ECDC4" },
  live: { label: "진행중", text: "#FFB347" },
  done: { label: "완료", text: "#8892a0" },
};

// 참여자 상세·관리자 상세가 공유하는 행사 정보 본문 (포스터 헤더 + 설명 + 상세표).
// footer 슬롯에 참여자 CTA / 관리자 액션 버튼을 각각 넣는다.
export default function EventInfoView({ event, backTo, footer }: { event: EventRecord; backTo?: string; footer?: ReactNode }) {
  const status = computeEventStatus(event.event_date, event.start_time, 0);
  const meta = STATUS_META[status];
  const isDone = status === "done";
  // 행사마다 색을 돌리던 것을 폐기 — 원티드엔 카테고리 팔레트가 없다.
  const color = ACCENT;

  const rows = [
    { label: "일정", value: [event.event_date, event.start_time ? `${event.start_time.slice(0, 5)} 시작` : null].filter(Boolean).join(" · ") },
    ...(event.place_name ? [{ label: "장소", value: event.place_name }] : []),
    ...(event.details ?? []),
  ];

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      {/* 배너 헤더 */}
      <div className="relative w-full overflow-hidden shrink-0" style={{ height: 260 }}>
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{ filter: isDone ? "grayscale(60%) brightness(0.5)" : "brightness(0.55)" }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: isDone ? "linear-gradient(135deg, #1a1a2a, #0f1117)" : `linear-gradient(135deg, ${color}22 0%, #0f1117 60%)` }}
          >
            <motion.div
              animate={isDone ? {} : { scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ opacity: isDone ? 0.2 : 0.4 }}
            >
              {event.emoji ? <span style={{ fontSize: 72 }}>{event.emoji}</span> : <CalendarDays size={72} color={color} strokeWidth={1.5} />}
            </motion.div>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,17,23,0.2) 0%, rgba(15,17,23,0) 40%, rgba(15,17,23,1) 100%)" }} />
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 80%, ${color}22 0%, transparent 70%)` }} />

        <div className="absolute top-4 left-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <BackButton to={backTo} />
        </div>

        <div className="absolute top-4 right-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", color: meta.text, border: `1px solid ${meta.text}40` }}
          >
            {meta.label}
          </span>
        </div>

        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            {event.emoji && <span style={{ fontSize: 20 }}>{event.emoji}</span>}
            <h2 className="text-xl font-black" style={{ color: "#f0f2f8" }}>{event.title}</h2>
          </div>
          <p className="text-xs font-semibold flex items-center gap-1" style={{ color: `${color}cc` }}>
            <CalendarDays size={11} />
            {event.event_date}
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className="px-5 pt-5 flex flex-col gap-6" style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}>
        {event.description && <p className="text-sm leading-relaxed" style={{ color: "#8892a0" }}>{event.description}</p>}

        {rows.length > 0 && (
          <div className="rounded-2xl overflow-hidden flex flex-col" style={{ border: `1px solid ${color}20`, background: "rgba(255,255,255,0.025)" }}>
            {rows.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-4 py-3"
                style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
              >
                <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color, minWidth: 64 }}>{d.label}</span>
                <span className="text-xs leading-relaxed" style={{ color: "#c0c8d4" }}>{d.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* 포스터 (원본 비율) */}
        {event.image_url ? (
          <img src={event.image_url} alt={`${event.title} 포스터`} className="w-full h-auto rounded-2xl" style={{ border: `1px solid ${color}20` }} />
        ) : (
          <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <ImageIcon size={16} color="#4a5568" />
            <p className="text-xs" style={{ color: "#4a5568" }}>공식 포스터가 등록되면 여기에 표시돼요</p>
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}
