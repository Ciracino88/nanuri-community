import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Plus, Receipt, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import { useEventList } from "../hooks/useEvents";
import { computeEventStatus } from "../lib/eventStatus";
import ActionRow from "../components/ui/ActionRow";
import Button from "../components/ui/Button";

export default function HomePage() {
  const navigate = useNavigate();
  const { data: events = [] } = useEventList();

  const featured = events.find((e) => computeEventStatus(e.event_date, e.start_time, 0) !== "done");

  return (
    <div className="flex-1 flex flex-col">
      <div className="pb-6" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>

        {/* 헤더 */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-title font-bold text-fg-strong">나누리</h1>
          <button
            onClick={() => toast("준비 중이에요", { icon: "🔔" })}
            className="w-10 h-10 rounded-tile bg-card shadow-card flex items-center justify-center active:scale-95 transition"
            aria-label="알림"
          >
            <Bell size={20} className="text-fg-muted" />
          </button>
        </div>

        {/* 히어로: 가장 가까운 예정 행사 */}
        {featured ? (
          <button
            onClick={() => navigate(`/event/${featured.id}`)}
            className="mx-5 mb-6 w-[calc(100%-2.5rem)] rounded-card bg-card shadow-card p-5 text-left active:scale-[0.99] transition"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-field bg-status-bg-active text-primary-normal flex items-center justify-center shrink-0">
                <CalendarDays size={22} strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-micro font-semibold tracking-wider uppercase text-fg-muted">행사 안내</span>
                <h2 className="text-heading font-bold text-fg-strong leading-snug mt-1">{featured.title}</h2>
                <p className="text-body text-fg-muted mt-1">{featured.event_date}</p>
              </div>
            </div>
            <span className="mt-4 flex items-center gap-1 text-body font-semibold text-accent">
              자세히 보기 <ChevronRight size={14} />
            </span>
          </button>
        ) : (
          <div className="mx-5 mb-6 rounded-card bg-card shadow-card px-5 py-6 text-center">
            <p className="text-body text-fg-muted">예정된 행사가 없어요</p>
          </div>
        )}

        {/* 빠른 메뉴 */}
        <div className="px-5 mb-6">
          <h3 className="text-body font-semibold text-fg-muted mb-2.5">빠른 메뉴</h3>
          <div className="flex flex-col gap-2.5">
            <ActionRow
              Icon={Receipt}
              label="비용 청구"
              desc="영수증 올리고 청구서 작성"
              onClick={() => navigate("/member/bill")}
            />
            <ActionRow
              Icon={CalendarDays}
              label="일정 보기"
              desc="다가오는 행사 일정"
              onClick={() => navigate("/events")}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="px-5">
          <Button onClick={() => navigate("/member/bill")} className="active:scale-[0.99]">
            <span className="flex items-center justify-center gap-2">
              <Plus size={20} strokeWidth={2.5} />
              새 비용 청구서 작성
            </span>
          </Button>
        </div>

      </div>
    </div>
  );
}
