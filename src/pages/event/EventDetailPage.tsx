import { useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
import PageContainer from "../../components/PageContainer";
import LoadingScreen from "../../components/LoadingScreen";
import { supabase } from "../../lib/supabase";
import { buildTimeline, formatClock, formatEventDate, type TimelineSegment } from "../../lib/eventTime";
import { useEventDetail, eventKeys, type EventDetailData } from "../../hooks/useEvents";
import type { Segment } from "../../types/event";

function SortableSegmentRow({ item, onDelete }: { item: TimelineSegment<Segment>; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-xl p-3.5 flex items-start gap-2.5 bg-card border ${
        isDragging ? "border-purple/40 shadow-lg" : "border-line-soft"
      }`}
    >
      <span className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-purple border-2 border-card" aria-hidden="true" />
      <button
        {...attributes}
        {...listeners}
        aria-label="순서 이동 핸들"
        className="touch-none cursor-grab active:cursor-grabbing text-fg-faint hover:text-fg-muted transition shrink-0 mt-0.5"
      >
        <i className="ti ti-grip-vertical text-emphasis" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.start && (
            <span className="text-caption font-medium text-purple bg-purple-subtle rounded-md px-1.5 py-0.5 shrink-0">
              {formatClock(item.start)}
            </span>
          )}
          <p className="text-body font-medium text-fg-strong truncate">{item.title}</p>
          <span className="text-caption text-fg-faint shrink-0">{item.duration_min}분</span>
        </div>
        {item.description && <p className="text-caption text-fg-faint mt-1">{item.description}</p>}
      </div>
      <button
        onClick={onDelete}
        aria-label="순서 삭제"
        className="text-fg-faint hover:text-danger active:scale-90 transition shrink-0"
      >
        <i className="ti ti-trash text-emphasis" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const toggleResultsMutation = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase.from("events").update({ results_public: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, next) => {
      toast.success(next ? "참여자에게 결과를 공개했어요" : "결과를 비공개로 바꿨어요");
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
    },
    onError: () => toast.error("변경에 실패했어요"),
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
    return (
      <PageContainer width="default">
        <p className="text-body text-fg-faint text-center py-20">행사를 찾을 수 없어요</p>
      </PageContainer>
    );
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
    <PageContainer width="default">

      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/events")} className="text-fg-faint hover:text-fg-muted transition" aria-label="뒤로">
          <i className="ti ti-arrow-left text-heading" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-heading font-medium text-fg-strong truncate">{event.title}</h1>
          <p className="text-caption text-fg-faint mt-0.5">
            {formatEventDate(event.event_date)}
            {event.start_time && ` · ${event.start_time.slice(0, 5)} 모임`}
            {event.place_name && ` · ${event.place_name}`}
          </p>
        </div>
        <button
          onClick={() => navigate(`/admin/events/${event.id}/results`)}
          className="flex items-center gap-1.5 text-caption font-medium text-purple bg-purple-subtle rounded-lg px-3 py-2 hover:opacity-80 active:scale-95 transition shrink-0"
        >
          <i className="ti ti-chart-bar text-emphasis" aria-hidden="true" />
          결과
        </button>
      </div>

      {event.image_url && (
        <img
          src={event.image_url}
          alt={`${event.title} 포스터`}
          className="w-full h-auto rounded-2xl border border-line-soft"
        />
      )}

      {/* 결과 공개 */}
      <div className="bg-card border border-line-soft rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-body font-medium text-fg">결과 공개</p>
          <p className="text-caption text-fg-faint mt-0.5">참여자도 순서별 집계를 볼 수 있어요</p>
        </div>
        <button
          onClick={() => toggleResultsMutation.mutate(!event.results_public)}
          aria-label="결과 공개 토글"
          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${event.results_public ? "bg-purple" : "bg-sunken"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-card rounded-full shadow-sm transition-all ${event.results_public ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>

      {/* 순서 목록 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-caption text-fg-faint font-medium">순서 {segments.length > 0 && `(${segments.length}개)`}</p>

        {timeline.length === 0 ? (
          <div className="bg-card border border-line-soft rounded-xl p-5 text-center text-body text-fg-faint">
            아직 순서가 없어요. 아래에서 추가하세요
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={timeline.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="relative flex flex-col gap-2 pl-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-line" aria-hidden="true" />
                {timeline.map((s) => (
                  <SortableSegmentRow key={s.id} item={s} onDelete={() => deleteMutation.mutate(s.id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 순서 추가 */}
      <div className="bg-card border border-line-soft rounded-xl p-4 flex flex-col gap-3">
        <p className="text-body font-medium text-fg-muted">순서 추가</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="순서 이름 (예: 예배)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-emphasis rounded-lg border border-line bg-card outline-none focus:ring-2 focus:ring-purple-subtle focus:border-purple transition"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-16 px-2.5 py-2 text-emphasis text-center rounded-lg border border-line bg-card outline-none focus:ring-2 focus:ring-purple-subtle focus:border-purple transition"
            />
            <span className="text-body text-fg-faint">분</span>
          </div>
        </div>
        <input
          type="text"
          placeholder="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 text-body text-fg bg-surface rounded-lg border-none outline-none placeholder-fg-faint"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!canAdd}
          className="w-full py-2.5 rounded-lg text-emphasis font-medium bg-purple-subtle text-purple transition hover:opacity-80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-1.5"
        >
          <i className="ti ti-plus text-emphasis" aria-hidden="true" />
          순서 추가
        </button>
      </div>

    </PageContainer>
  );
}
