import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { CalendarDays, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../components/BackButton";
import LoadingSpinner from "../../components/LoadingSpinner";
import { supabase } from "../../lib/supabase";
import { deleteImage } from "../../lib/deleteImage";
import { computeEventStatus, EVENT_STATUS_LABEL, type EventStatus } from "../../lib/eventStatus";
import { useAdminEvents, eventKeys } from "../../hooks/useEvents";
import { TAB_COLORS } from "../../constants/theme";

const ACCENT = TAB_COLORS.admin;

const STATUS_META: Record<EventStatus, { bg: string; text: string }> = {
  upcoming: { bg: "rgba(78,205,196,0.15)", text: "#4ECDC4" },
  live: { bg: "rgba(255,179,71,0.15)", text: "#FFB347" },
  done: { bg: "rgba(255,255,255,0.07)", text: "#8892a0" },
};

export default function EventAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useAdminEvents();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string | null }) => {
      if (imageUrl) await deleteImage(imageUrl);
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.adminList }),
    onError: () => toast.error("삭제에 실패했어요"),
  });

  const handleDelete = (id: string, imageUrl: string | null) => {
    if (!confirm("행사를 삭제할까요? 순서와 평가 데이터도 모두 삭제됩니다.")) return;
    deleteMutation.mutate({ id, imageUrl });
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3 shrink-0">
        <BackButton to="/admin" />
        <h1 className="text-lg font-black" style={{ color: "#f0f2f8" }}>행사 관리</h1>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <LoadingSpinner color={ACCENT} />
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <CalendarDays size={32} color="#4a5568" />
            <p className="text-sm font-semibold" style={{ color: "#4a5568" }}>등록된 행사가 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {events.map((ev, i) => {
              const status = computeEventStatus(ev.event_date, ev.start_time, ev.totalDuration);
              const meta = STATUS_META[status];
              return (
                <motion.div
                  key={ev.id}
                  className="rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 360, damping: 30 }}
                >
                  <button
                    onClick={() => navigate(`/admin/events/${ev.id}`)}
                    className="min-w-0 flex-1 text-left flex items-center gap-3 active:scale-[0.99] transition"
                  >
                    {ev.image_url ? (
                      <img src={ev.image_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                    ) : (
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ACCENT}22` }}>
                        <CalendarDays size={18} color={ACCENT} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate" style={{ color: "#f0f2f8" }}>{ev.title}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: meta.bg, color: meta.text }}>
                          {EVENT_STATUS_LABEL[status]}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#6b7785" }}>
                        {ev.event_date}
                        {ev.place_name && ` · ${ev.place_name}`}
                        {` · 순서 ${ev.segmentCount}개`}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id, ev.image_url)}
                    aria-label="삭제"
                    className="w-10 h-10 flex items-center justify-center rounded-lg shrink-0 active:scale-95 transition"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#8892a0" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 새 행사 FAB */}
      <motion.button
        onClick={() => navigate("/admin/events/new")}
        className="absolute bottom-6 right-4 flex items-center gap-2 px-5 py-3.5 rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 8px 32px ${ACCENT}44, 0 2px 8px rgba(0,0,0,0.4)` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
        whileTap={{ scale: 0.93 }}
      >
        <Plus size={18} strokeWidth={2.5} />
        <span className="text-sm font-black">새 행사</span>
      </motion.button>
    </div>
  );
}
