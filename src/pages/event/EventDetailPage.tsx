import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Pencil, ListOrdered, BarChart3, Trash2, ChevronRight, type LucideIcon } from "lucide-react";
import EventInfoView from "../../components/EventInfoView";
import LoadingScreen from "../../components/LoadingScreen";
import { supabase } from "../../lib/supabase";
import { deleteImage } from "../../lib/deleteImage";
import { useEventDetail, eventKeys } from "../../hooks/useEvents";
import { TAB_COLORS } from "../../constants/theme";

const ACCENT = TAB_COLORS.admin;

function ActionRow({ Icon, label, desc, onClick }: { Icon: LucideIcon; label: string; desc?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-2xl text-left active:scale-[0.99] transition"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ACCENT}18` }}>
        <Icon size={18} color={ACCENT} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "#f0f2f8" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>{desc}</p>}
      </div>
      <ChevronRight size={18} color="#4a5568" />
    </button>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useEventDetail(id);
  const event = data?.event ?? null;

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (event?.image_url) await deleteImage(event.image_url);
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.adminList });
      toast.success("행사를 삭제했어요");
      navigate("/admin");
    },
    onError: () => toast.error("삭제에 실패했어요"),
  });

  const handleDeleteEvent = () => {
    if (!confirm("행사를 삭제할까요? 순서와 평가 데이터도 모두 삭제됩니다.")) return;
    deleteEventMutation.mutate();
  };

  if (isLoading) return <LoadingScreen />;
  if (!event) {
    return <p className="flex-1 flex items-center justify-center text-sm" style={{ color: "#4a5568" }}>행사를 찾을 수 없어요</p>;
  }

  const footer = (
    <div className="flex flex-col gap-3">
      {/* 액션 */}
      <ActionRow Icon={Pencil} label="정보 수정" desc="제목·날짜·장소·상세 정보" onClick={() => navigate(`/admin/events/${event.id}/edit`)} />
      <ActionRow Icon={ListOrdered} label="진행 관리" desc="순서(타임라인) 편집" onClick={() => navigate(`/admin/events/${event.id}/segments`)} />
      <ActionRow Icon={BarChart3} label="통계" desc="순서별 만족도·평가 결과" onClick={() => navigate(`/admin/events/${event.id}/results`)} />

      {/* 삭제 */}
      <button
        onClick={handleDeleteEvent}
        disabled={deleteEventMutation.isPending}
        className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition disabled:opacity-50"
        style={{ color: "#FF6B6B", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)" }}
      >
        <Trash2 size={15} />
        행사 삭제
      </button>
    </div>
  );

  return <EventInfoView event={event} backTo="/admin" footer={footer} />;
}
