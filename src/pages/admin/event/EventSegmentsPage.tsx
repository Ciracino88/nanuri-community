import { useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { GripVertical, Pencil, Trash2, Plus, Clock, ListOrdered, Check } from "lucide-react";
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
import BackButton from "../../../components/BackButton";
import TextField from "../../../components/ui/TextField";
import TextArea from "../../../components/ui/TextArea";
import Button from "../../../components/ui/Button";
import BottomSheet from "../../../components/ui/BottomSheet";
import LoadingScreen from "../../../components/LoadingScreen";
import { confirmDialog } from "../../../components/ConfirmDialog";
import { supabase } from "../../../lib/supabase";
import { buildTimeline, formatClock, totalDuration, type TimelineSegment } from "../../../lib/eventTime";
import { useEventDetail, eventKeys, type EventDetailData } from "../../../hooks/useEvents";
import { TINT_STRONG, tintByIndex } from "../../../constants/tints";
import type { Segment } from "../../../types/event";

function fmtDuration(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

interface SegmentDraft {
  title: string;
  duration_min: number;
  description: string | null;
}

// ── 추가/수정 시트 ────────────────────────────────────
function SegmentSheet({ initial, onSave, onClose, saving }: {
  initial?: Segment;
  onSave: (draft: SegmentDraft) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [duration, setDuration] = useState(initial ? String(initial.duration_min) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<{ title?: string; duration?: string }>({});

  const submit = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = "제목을 입력해주세요";
    if (!(Number(duration) > 0)) e.duration = "소요시간을 입력해주세요";
    if (e.title || e.duration) { setErrors(e); return; }
    onSave({ title: title.trim(), duration_min: Number(duration), description: description.trim() || null });
  };

  return (
    <BottomSheet title={initial ? "프로그램 수정" : "프로그램 추가"} onClose={onClose}>
      <TextField
        label="제목" placeholder="예) 오프닝 & 환영 인사"
        value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        label="소요시간" type="number" inputMode="numeric" min={1} suffix="분" placeholder="30"
        value={duration} error={errors.duration} onChange={(e) => setDuration(e.target.value)}
      />
      <TextArea
        label="설명 (선택)" rows={3} placeholder="이 프로그램에 대한 설명을 입력해주세요"
        value={description} onChange={(e) => setDescription(e.target.value)}
      />

      <Button type="button" onClick={submit} loading={saving} className="mt-1">
        <span className="flex items-center justify-center gap-2">
          <Check size={18} />
          저장하기
        </span>
      </Button>
    </BottomSheet>
  );
}

// ── 순서 카드 (드래그) ────────────────────────────────
function SortableRow({ item, index, onEdit, onDelete }: {
  item: TimelineSegment<Segment>;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    // 집어 든 카드는 더 높이 뜬다 — 그림자로 층을 만드는 게 이 디자인의 분리 방식이다.
    boxShadow: isDragging ? "var(--shadow-lift)" : "var(--shadow-card)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-card bg-card p-4 flex items-start gap-3 ${isDragging ? "ring-1 ring-accent-soft" : ""}`}
    >
      <button
        {...attributes} {...listeners}
        aria-label="프로그램 이동"
        className="mt-1 touch-none cursor-grab active:cursor-grabbing shrink-0 text-fg-faint"
      >
        <GripVertical size={18} />
      </button>
      {/* 번호 색은 순서에 따른 장식이지 항목의 의미가 아니다. */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold shrink-0 ${TINT_STRONG[tintByIndex(index)]}`}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-body font-semibold truncate text-fg-strong">{item.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-caption font-semibold text-fg">{fmtDuration(item.duration_min)}</span>
              {item.start && <span className="text-caption text-fg-muted">{formatClock(item.start)} ~</span>}
            </div>
            {item.description && <p className="text-caption mt-1.5 leading-relaxed line-clamp-2 text-fg-muted">{item.description}</p>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onEdit} aria-label="수정" className="w-8 h-8 rounded-tile flex items-center justify-center active:scale-90 transition bg-sunken text-fg-muted">
              <Pencil size={14} />
            </button>
            <button onClick={onDelete} aria-label="삭제" className="w-8 h-8 rounded-tile flex items-center justify-center active:scale-90 transition bg-sunken text-fg-muted">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventSegmentsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [sheet, setSheet] = useState<{ open: boolean; editing: Segment | null }>({ open: false, editing: null });

  const { data, isLoading } = useEventDetail(id);
  const event = data?.event ?? null;
  const segments = data?.segments ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });

  const saveMutation = useMutation({
    mutationFn: async (draft: SegmentDraft) => {
      if (sheet.editing) {
        const { error } = await supabase.from("event_segments").update(draft).eq("id", sheet.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_segments").insert({ event_id: id, ...draft, sort: segments.length });
        if (error) throw error;
      }
    },
    onSuccess: () => { setSheet({ open: false, editing: null }); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "저장에 실패했어요"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase.from("event_segments").delete().eq("id", segmentId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("삭제에 실패했어요"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(orderedIds.map(async (segId, i) => {
        const { error } = await supabase.from("event_segments").update({ sort: i }).eq("id", segId);
        if (error) throw error;
      }));
    },
    onSuccess: invalidate,
    onError: () => { toast.error("순서 변경에 실패했어요"); invalidate(); },
  });

  const handleDelete = async (segment: Segment) => {
    const ok = await confirmDialog({
      title: "프로그램을 삭제할까요?",
      message: `"${segment.title}" 프로그램이 삭제됩니다.`,
      confirmLabel: "삭제",
      danger: true,
    });
    if (ok) deleteMutation.mutate(segment.id);
  };

  if (isLoading) return <LoadingScreen />;
  if (!event) return <p className="flex-1 flex items-center justify-center text-body text-fg-muted">행사를 찾을 수 없어요</p>;

  const timeline = buildTimeline(event.event_date, event.start_time, segments);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = segments.findIndex((s) => s.id === active.id);
    const newIndex = segments.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(segments, oldIndex, newIndex);
    queryClient.setQueryData(eventKeys.detail(id), (old: EventDetailData | undefined) => old ? { ...old, segments: newOrder } : old);
    reorderMutation.mutate(newOrder.map((s) => s.id));
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <BackButton to={`/admin/events/${event.id}`} />
        <div className="mt-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-micro font-semibold uppercase tracking-widest text-fg-muted">관리자</span>
            <span className="text-micro text-fg-muted">· 진행 관리</span>
          </div>
          <h1 className="text-display font-bold leading-snug truncate text-fg-strong">{event.title}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-caption text-fg-muted"><Clock size={12} /> 총 {fmtDuration(totalDuration(segments))}</span>
            <span className="flex items-center gap-1 text-caption text-fg-muted"><ListOrdered size={12} /> {segments.length}개 프로그램</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 flex flex-col gap-3">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-panel flex items-center justify-center bg-sunken">
              <ListOrdered size={28} className="text-fg-faint" />
            </div>
            <div>
              <p className="text-body font-semibold text-fg">프로그램이 없어요</p>
              <p className="text-caption mt-0.5 text-fg-muted">아래 버튼을 눌러 추가해보세요</p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-card px-4 py-3 flex items-center gap-3 bg-sunken">
              <GripVertical size={16} className="shrink-0 text-fg-faint" />
              <p className="text-caption text-fg-muted">드래그하여 순서를 변경할 수 있어요</p>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={timeline.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {timeline.map((s, i) => (
                    <SortableRow key={s.id} item={s} index={i} onEdit={() => setSheet({ open: true, editing: s })} onDelete={() => handleDelete(s)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}

      </div>

      {/* 플로팅 추가 버튼 */}
      <motion.button
        onClick={() => setSheet({ open: true, editing: null })}
        className="absolute left-1/2 -translate-x-1/2 rounded-full px-6 py-3.5 text-body font-semibold flex items-center gap-2 bg-accent text-white shadow-accent"
        style={{ bottom: "1.5rem" }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
        whileTap={{ scale: 0.96 }}
      >
        <Plus size={18} strokeWidth={2.5} /> 프로그램 추가
      </motion.button>

      <AnimatePresence>
        {sheet.open && (
          <SegmentSheet
            initial={sheet.editing ?? undefined}
            saving={saveMutation.isPending}
            onSave={(draft) => saveMutation.mutate(draft)}
            onClose={() => setSheet({ open: false, editing: null })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
