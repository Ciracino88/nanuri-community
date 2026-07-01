import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CalendarIcon } from "@heroicons/react/outline";
import PageContainer from "../../components/PageContainer";
import PageHero from "../../components/PageHero";
import LoadingSpinner from "../../components/LoadingSpinner";
import { supabase } from "../../lib/supabase";
import { deleteImage } from "../../lib/deleteImage";
import { formatEventDate } from "../../lib/eventTime";
import { computeEventStatus, EVENT_STATUS_LABEL, type EventStatus } from "../../lib/eventStatus";
import { useAdminEvents, eventKeys } from "../../hooks/useEvents";
import { TAB_COLORS } from "../../constants/theme";

const STATUS_STYLE: Record<EventStatus, string> = {
  upcoming: "text-fg-faint bg-surface",
  live: "text-teal bg-teal-subtle",
  done: "text-fg-faint bg-surface",
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
    <PageContainer width="default">

      <PageHero Icon={CalendarIcon} title="행사 관리" desc={"행사를 만들고\n순서를 구성하세요"} tint="purple" />

      {isLoading ? (
        <LoadingSpinner color={TAB_COLORS.events} />
      ) : events.length === 0 ? (
        <div className="bg-card border border-line-soft rounded-xl p-6 text-center text-body text-fg-faint">
          등록된 행사가 없어요
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {events.map((ev) => {
            const status = computeEventStatus(ev.event_date, ev.start_time, ev.totalDuration);
            return (
              <div key={ev.id} className="bg-card border border-line-soft rounded-2xl p-4 flex items-center gap-3 hover:border-line transition">
                <button
                  onClick={() => navigate(`/admin/events/${ev.id}`)}
                  className="min-w-0 flex-1 text-left flex items-center gap-3 active:scale-[0.99] transition"
                >
                  {ev.image_url ? (
                    <img src={ev.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-line-soft shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-purple-subtle flex items-center justify-center shrink-0">
                      <i className="ti ti-calendar-event text-purple text-emphasis" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-medium text-fg-strong truncate">{ev.title}</p>
                      <span className={`text-caption rounded-full px-2 py-0.5 shrink-0 ${STATUS_STYLE[status]}`}>
                        {EVENT_STATUS_LABEL[status]}
                      </span>
                    </div>
                    <p className="text-caption text-fg-faint mt-0.5 truncate">
                      {formatEventDate(ev.event_date)}
                      {ev.place_name && ` · ${ev.place_name}`}
                      {` · 순서 ${ev.segmentCount}개`}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(ev.id, ev.image_url)}
                  aria-label="삭제"
                  title="삭제"
                  className="w-10 h-10 flex items-center justify-center border border-line-soft rounded-lg text-fg-faint hover:text-danger hover:border-danger-soft active:scale-95 transition shrink-0"
                >
                  <i className="ti ti-trash text-emphasis" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB 가림 방지 */}
      <div className="h-14" aria-hidden="true" />

      {/* 새 행사 플로팅 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div className="max-w-md mx-auto relative">
          <button
            onClick={() => navigate("/admin/events/new")}
            className="pointer-events-auto absolute right-5 flex items-center gap-1.5 bg-purple text-white rounded-full pl-4 pr-5 py-3.5 text-body font-medium active:scale-95 transition"
            style={{
              bottom: "calc(88px + env(safe-area-inset-bottom))",
              boxShadow: "0 6px 20px rgba(83,74,183,0.35)",
            }}
          >
            <i className="ti ti-plus text-emphasis" aria-hidden="true" />
            새 행사
          </button>
        </div>
      </div>

    </PageContainer>
  );
}
