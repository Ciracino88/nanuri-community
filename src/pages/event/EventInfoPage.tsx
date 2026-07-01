import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import EventInfoView from "../../components/EventInfoView";
import LoadingScreen from "../../components/LoadingScreen";
import { useEventDetail } from "../../hooks/useEvents";
import { computeEventStatus } from "../../lib/eventStatus";
import { colorForEvent } from "../../lib/eventColor";

export default function EventInfoPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useEventDetail(id);
  const event = data?.event ?? null;

  if (isLoading) return <LoadingScreen />;
  if (!event) {
    return <p className="flex-1 flex items-center justify-center text-sm" style={{ color: "#4a5568" }}>행사를 찾을 수 없어요</p>;
  }

  const isDone = computeEventStatus(event.event_date, event.start_time, 0) === "done";
  const color = colorForEvent(event.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    toast.success("링크가 복사되었어요");
  };

  const footer = !isDone ? (
    <div className="flex gap-3">
      <motion.button
        className="flex-1 py-3.5 rounded-2xl text-sm font-black"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, color: "#0f1117" }}
        whileTap={{ scale: 0.96 }}
        onClick={() => toast.success("일정이 추가되었어요")}
      >
        내 일정에 추가
      </motion.button>
      <motion.button
        className="py-3.5 px-4 rounded-2xl text-sm font-bold"
        style={{ background: "rgba(255,255,255,0.06)", color: "#8892a0", border: "1px solid rgba(255,255,255,0.08)" }}
        whileTap={{ scale: 0.96 }}
        onClick={handleShare}
      >
        공유
      </motion.button>
    </div>
  ) : null;

  return <EventInfoView event={event} footer={footer} />;
}
