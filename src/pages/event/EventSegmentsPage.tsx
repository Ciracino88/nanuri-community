import { useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { GripVertical, Trash2, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BackButton from "../../components/BackButton";
import TextField from "../../components/ui/TextField";
import LoadingScreen from "../../components/LoadingScreen";
import { supabase } from "../../lib/supabase";
import { buildTimeline, formatClock, type TimelineSegment } from "../../lib/eventTime";
import { useEventDetail, eventKeys, type EventDetailData } from "../../hooks/useEvents";
import { TAB_COLORS } from "../../constants/theme";
import type { Segment } from "../../types/event";

const ACCENT = TAB_COLORS.admin;

function SortableSegmentRow({ item, onDelete }: { item: TimelineSegment<Segment>; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${isDragging ? `${ACCENT}66` : "rgba(255,255,255,0.07)"}`,
    boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.45)" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative rounded-xl p-3.5 flex items-start gap-2.5">
      <span className="absolute -left-[23px] top-4 w-3 h-3 rounded-full" style={{ background: ACCENT, border: "2px solid #0f1117" }} aria-hidden="true" />
      <button {...attributes} {...listeners} aria-label="순서 이동 핸들" className="touch-none cursor-grab active:cursor-grabbing shrink-0 mt-0.5" style={{ color: "#6b7785" }}>
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.start && (
            <span className="text-xs font-bold rounded-md px-1.5 py-0.5 shrink-0" style={{ color: ACCENT, background: `${ACCENT}22` }}>
              {formatClock(item.start)}
            </span>
          )}
          <p className="text-sm font-bold truncate" style={{ color: "#f0f2f8" }}>{item.title}</p>
          <span className="text-xs shrink-0" style={{ color: "#6b7785" }}>{item.duration_min}분</span>
        </div>
        {item.description && <p className="text-xs mt-1" style={{ color: "#6b7785" }}>{item.description}</p>}
      </div>
      <button onClick={onDelete} aria-label="순서 삭제" className="shrink-0 active:scale-90 transition" style={{ color: "#6b7785" }}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function EventSegmentsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [duration, setDuration] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data, isLoading } = useEventDetail(id);
  const event = data?.event ?? null;
  const segments = data?.segments ?? [];

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("행사를 찾을 수 없어요");
      const { error } = await supabase.from("event_segments").insert({
        event_id: event.id,
        duration_min: Number(duration),
        title: title.trim(),
        description: description.trim() || null,
        sort: segments.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDuration("");
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "순서 추가에 실패했어요"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase.from("event_segments").delete().eq("id", segmentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) }),
    onError: () => toast.error("삭제에 실패했어요"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map(async (segId, i) => {
          const { error } = await supabase.from("event_segments").update({ sort: i }).eq("id", segId);
          if (error) throw error;
        })
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) }),
    onError: () => {
      toast.error("순서 변경에 실패했어요");
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (!event) {
    return <p className="flex-1 flex items-center justify-center text-sm" style={{ color: "#4a5568" }}>행사를 찾을 수 없어요</p>;
  }

  const timeline = buildTimeline(event.event_date, event.start_time, segments);
  const canAdd = !!title.trim() && Number(duration) > 0 && !addMutation.isPending;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = segments.findIndex((s) => s.id === active.id);
    const newIndex = segments.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(segments, oldIndex, newIndex);
    queryClient.setQueryData(eventKeys.detail(id), (old: EventDetailData | undefined) =>
      old ? { ...old, segments: newOrder } : old
    );
    reorderMutation.mutate(newOrder.map((s) => s.id));
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <BackButton to={`/admin/events/${event.id}`} />
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-black truncate" style={{ color: "#f0f2f8" }}>진행 관리</h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: "#6b7785" }}>{event.title}</p>
        </div>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-5" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        {/* 순서 목록 */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-bold" style={{ color: "#6b7785" }}>순서 {segments.length > 0 && `(${segments.length}개)`}</p>

          {timeline.length === 0 ? (
            <div className="rounded-xl p-5 text-center text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#6b7785" }}>
              아직 순서가 없어요. 아래에서 추가하세요
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={timeline.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="relative flex flex-col gap-2 pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5" style={{ background: "rgba(255,255,255,0.1)" }} aria-hidden="true" />
                  {timeline.map((s) => (
                    <SortableSegmentRow key={s.id} item={s} onDelete={() => deleteMutation.mutate(s.id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* 순서 추가 */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-sm font-bold" style={{ color: "#8892a0" }}>순서 추가</p>
          <div className="flex items-start gap-2">
            <TextField wrapperClassName="flex-1 min-w-0" accent={ACCENT} placeholder="순서 이름 (예: 예배)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField wrapperClassName="w-24 shrink-0" accent={ACCENT} type="number" inputMode="numeric" min={1} suffix="분" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <TextField accent={ACCENT} placeholder="설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button
            onClick={() => addMutation.mutate()}
            disabled={!canAdd}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-1.5"
            style={{ background: `${ACCENT}22`, color: ACCENT }}
          >
            <Plus size={16} />
            순서 추가
          </button>
        </div>
      </div>
    </div>
  );
}
