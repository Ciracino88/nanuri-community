import { useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { GripVertical, Pencil, Trash2, Plus, Clock, ListOrdered, X, Check } from "lucide-react";
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
import TextArea from "../../components/ui/TextArea";
import LoadingScreen from "../../components/LoadingScreen";
import { supabase } from "../../lib/supabase";
import { buildTimeline, formatClock, totalDuration, type TimelineSegment } from "../../lib/eventTime";
import { useEventDetail, eventKeys, type EventDetailData } from "../../hooks/useEvents";
import { TAB_COLORS } from "../../constants/theme";
import type { Segment } from "../../types/event";

const ACCENT = TAB_COLORS.admin;
const DOT_COLORS = Object.values(TAB_COLORS);

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

// ── 추가/수정 모달 ────────────────────────────────────
function SegmentModal({ initial, onSave, onClose, saving }: {
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
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-t-3xl px-6 pt-3 flex flex-col gap-4"
        style={{ background: "rgba(22,25,35,0.99)", borderTop: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 -12px 48px rgba(0,0,0,0.6)", paddingBottom: "calc(1.75rem + env(safe-area-inset-bottom))" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: "rgba(255,255,255,0.15)" }} />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black" style={{ color: "#f0f2f8" }}>{initial ? "순서 수정" : "순서 추가"}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "#8892a0" }}>
            <X size={16} />
          </button>
        </div>

        <TextField label="제목" accent={ACCENT} placeholder="예) 오프닝 & 환영 인사" value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="소요시간" type="number" inputMode="numeric" min={1} suffix="분" accent={ACCENT} placeholder="30" value={duration} error={errors.duration} onChange={(e) => setDuration(e.target.value)} />
        <TextArea label="설명 (선택)" rows={3} accent={ACCENT} placeholder="이 순서에 대한 설명을 입력해주세요" value={description} onChange={(e) => setDescription(e.target.value)} />

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 6px 24px ${ACCENT}44` }}
        >
          <Check size={18} />
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </motion.div>
    </motion.div>
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
  const color = DOT_COLORS[index % DOT_COLORS.length];
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${isDragging ? `${ACCENT}66` : "rgba(255,255,255,0.07)"}`,
    boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.45)" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl p-4 flex items-start gap-3">
      <button {...attributes} {...listeners} aria-label="순서 이동" className="mt-1 touch-none cursor-grab active:cursor-grabbing shrink-0" style={{ color: "#6b7785" }}>
        <GripVertical size={18} />
      </button>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: color, color: "#0f1117" }}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold truncate" style={{ color: "#f0f2f8" }}>{item.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold" style={{ color: ACCENT }}>{fmtDuration(item.duration_min)}</span>
              {item.start && <span className="text-xs" style={{ color: "#6b7785" }}>{formatClock(item.start)} ~</span>}
            </div>
            {item.description && <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "#6b7785" }}>{item.description}</p>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onEdit} aria-label="수정" className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#8892a0" }}>
              <Pencil size={14} />
            </button>
            <button onClick={onDelete} aria-label="삭제" className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition" style={{ background: "rgba(255,255,255,0.06)", color: "#8892a0" }}>
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

  const [modal, setModal] = useState<{ open: boolean; editing: Segment | null }>({ open: false, editing: null });

  const { data, isLoading } = useEventDetail(id);
  const event = data?.event ?? null;
  const segments = data?.segments ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });

  const saveMutation = useMutation({
    mutationFn: async (draft: SegmentDraft) => {
      if (modal.editing) {
        const { error } = await supabase.from("event_segments").update(draft).eq("id", modal.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_segments").insert({ event_id: id, ...draft, sort: segments.length });
        if (error) throw error;
      }
    },
    onSuccess: () => { setModal({ open: false, editing: null }); invalidate(); },
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

  if (isLoading) return <LoadingScreen />;
  if (!event) return <p className="flex-1 flex items-center justify-center text-sm" style={{ color: "#4a5568" }}>행사를 찾을 수 없어요</p>;

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
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>관리자</span>
            <span className="text-[11px]" style={{ color: "#6b7785" }}>· 진행 관리</span>
          </div>
          <h1 className="text-2xl font-black leading-snug truncate" style={{ color: "#f0f2f8" }}>{event.title}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs" style={{ color: "#6b7785" }}><Clock size={12} /> 총 {fmtDuration(totalDuration(segments))}</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "#6b7785" }}><ListOrdered size={12} /> {segments.length}개 순서</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 flex flex-col gap-3">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <ListOrdered size={28} color="#4a5568" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#8892a0" }}>타임라인이 없어요</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>아래 버튼을 눌러 추가해보세요</p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <GripVertical size={16} color="#6b7785" className="shrink-0" />
              <p className="text-xs" style={{ color: "#6b7785" }}>드래그하여 순서를 변경할 수 있어요</p>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={timeline.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {timeline.map((s, i) => (
                    <SortableRow key={s.id} item={s} index={i} onEdit={() => setModal({ open: true, editing: s })} onDelete={() => deleteMutation.mutate(s.id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}

      </div>

      {/* 플로팅 추가 버튼 */}
      <motion.button
        onClick={() => setModal({ open: true, editing: null })}
        className="absolute left-1/2 -translate-x-1/2 rounded-full px-6 py-3.5 text-sm font-black flex items-center gap-2"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 8px 32px ${ACCENT}55, 0 2px 8px rgba(0,0,0,0.4)` }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
        whileTap={{ scale: 0.96 }}
      >
        <Plus size={18} strokeWidth={2.5} /> 타임라인 추가
      </motion.button>

      <AnimatePresence>
        {modal.open && (
          <SegmentModal
            initial={modal.editing ?? undefined}
            saving={saveMutation.isPending}
            onSave={(draft) => saveMutation.mutate(draft)}
            onClose={() => setModal({ open: false, editing: null })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
