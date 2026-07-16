import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Clock, MapPin, Users, DollarSign, Star, Pencil, Plus, ChevronDown, Trash2, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../../components/BackButton";
import TextField from "../../../components/ui/TextField";
import { useReceiptUpload } from "../../../hooks/useReceiptUpload";
import { uploadReceipt } from "../../../lib/uploadReceipt";
import { deleteImage } from "../../../lib/deleteImage";
import { supabase } from "../../../lib/supabase";
import { useEventDetail, eventKeys } from "../../../hooks/useEvents";

const CUSTOM_FIELD_OPTIONS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "target", label: "대상", Icon: Users },
  { key: "cost", label: "비용", Icon: DollarSign },
  { key: "contact", label: "담당자", Icon: Star },
  { key: "note", label: "비고", Icon: Pencil },
];


interface CustomField { key: string; label: string; Icon: LucideIcon; value: string }

export default function EventBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const editing = !!id;
  const queryClient = useQueryClient();
  const { data: existing } = useEventDetail(id);
  const prefilled = useRef(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [multiDay, setMultiDay] = useState(false);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [keepImageUrl, setKeepImageUrl] = useState<string | null>(null);
  const [keepBannerUrl, setKeepBannerUrl] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const { receiptFile: posterFile, receiptPreview: posterPreview, handleReceiptChange: handlePoster, reset: resetPoster } = useReceiptUpload();
  const { receiptFile: bannerFile, receiptPreview: bannerPreview, handleReceiptChange: handleBanner, reset: resetBanner } = useReceiptUpload();

  // 편집 모드: 기존 행사 값으로 한 번만 프리필
  useEffect(() => {
    const ev = existing?.event;
    if (!ev || prefilled.current) return;
    prefilled.current = true;
    setTitle(ev.title);
    const [start, end] = ev.event_date.split("~");
    setDate(start.replace(/\./g, "-"));
    if (end) {
      setMultiDay(true);
      setEndDate(end.replace(/\./g, "-"));
    }
    setTime(ev.start_time ? ev.start_time.slice(0, 5) : "");
    setLocation(ev.place_name ?? "");
    const restored = (ev.details ?? [])
      .map((d) => {
        const opt = CUSTOM_FIELD_OPTIONS.find((o) => o.label === d.label);
        return opt ? { ...opt, value: d.value } : null;
      })
      .filter((f): f is CustomField => f !== null);
    setFields(restored);
    setKeepImageUrl(ev.image_url ?? null);
    setKeepBannerUrl(ev.banner_url ?? null);
  }, [existing]);

  const shownPoster = posterPreview || keepImageUrl;
  const shownBanner = bannerPreview || keepBannerUrl;
  const addable = CUSTOM_FIELD_OPTIONS.filter((o) => !fields.find((f) => f.key === o.key));
  const canSave = !!title.trim() && !!date && !!location.trim();

  const removePoster = () => {
    resetPoster();
    setKeepImageUrl(null);
  };
  const removeBanner = () => {
    resetBanner();
    setKeepBannerUrl(null);
  };

  const addField = (opt: (typeof CUSTOM_FIELD_OPTIONS)[number]) => {
    setFields((p) => [...p, { ...opt, value: "" }]);
    setShowPicker(false);
  };
  const updateField = (key: string, value: string) => setFields((p) => p.map((f) => (f.key === key ? { ...f, value } : f)));
  const removeField = (key: string) => setFields((p) => p.filter((f) => f.key !== key));

  const handleSave = async () => {
    if (!canSave) {
      toast.error("제목, 날짜, 장소는 필수예요");
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = keepImageUrl;
      if (posterFile) imageUrl = await uploadReceipt(posterFile, "events");
      let bannerUrl: string | null = keepBannerUrl;
      if (bannerFile) bannerUrl = await uploadReceipt(bannerFile, "events");

      const details = fields.filter((f) => f.value.trim()).map((f) => ({ label: f.label, value: f.value.trim() }));

      const dots = (d: string) => d.replace(/-/g, ".");
      const eventDateStr = multiDay && endDate ? `${dots(date)}~${dots(endDate)}` : dots(date);

      const payload = {
        title: title.trim(),
        event_date: eventDateStr,
        start_time: time || null,
        place_name: location.trim(),
        image_url: imageUrl,
        banner_url: bannerUrl,
        details,
      };

      if (editing) {
        const oldPoster = existing?.event?.image_url ?? null;
        const oldBanner = existing?.event?.banner_url ?? null;
        if (oldPoster && oldPoster !== imageUrl) await deleteImage(oldPoster);
        if (oldBanner && oldBanner !== bannerUrl) await deleteImage(oldBanner);
        const { error } = await supabase.from("events").update(payload).eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: eventKeys.adminList });
        toast.success("행사를 수정했어요");
        navigate(`/admin/events/${id}`);
      } else {
        const { data: event, error } = await supabase.from("events").insert(payload).select("id").single();
        if (error) throw error;
        toast.success("행사를 만들었어요. 프로그램을 추가하세요");
        navigate(`/admin/events/${event.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 헤더 — 스크롤 위로 떠 있어야 하므로 캔버스와 같은 색으로 덮고 아래에 선을 둔다. */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sticky top-0 z-10 bg-surface border-b border-line-soft">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="flex-1 text-emphasis font-bold text-fg-strong">{editing ? "행사 수정" : "행사 추가"}</h1>
        <motion.button
          className={`px-4 py-2 rounded-full text-body font-semibold transition ${
            canSave ? "bg-accent text-white shadow-accent" : "bg-sunken text-fg-faint"
          }`}
          whileTap={canSave ? { scale: 0.94 } : {}}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "저장"}
        </motion.button>
      </div>

      <div className="px-4 pt-5 pb-10 flex flex-col gap-6" style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}>

        {/* 필수 정보 */}
        <div className="flex flex-col gap-3">
          <label className="text-caption font-semibold uppercase text-fg-muted" style={{ letterSpacing: "0.15em" }}>필수 정보</label>

          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold text-fg-muted">행사 제목</span>
            <TextField placeholder="예) 여름 수련회" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold flex items-center gap-1 text-fg-muted">
                <CalendarDays size={11} /> 날짜
              </span>
              {/* 켜짐 = 선택 상태라 액센트가 담당한다. */}
              <motion.button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-semibold border transition ${
                  multiDay
                    ? "bg-accent-subtle border-accent-soft text-accent-strong"
                    : "bg-card border-line text-fg-muted"
                }`}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setMultiDay((v) => !v); setEndDate(""); }}
              >
                <CalendarDays size={10} />
                {multiDay ? "기간 선택 중" : "기간 설정"}
              </motion.button>
            </div>
            <AnimatePresence initial={false} mode="wait">
              {!multiDay ? (
                <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </motion.div>
              ) : (
                <motion.div key="range" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <TextField type="date" wrapperClassName="flex-1" value={date} onChange={(e) => setDate(e.target.value)} />
                  <span className="text-caption font-semibold shrink-0 text-fg-muted">–</span>
                  <TextField type="date" wrapperClassName="flex-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold flex items-center gap-1 text-fg-muted">
              <Clock size={11} /> 모이는 시각 (선택)
            </span>
            <TextField type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-caption font-semibold flex items-center gap-1 text-fg-muted">
              <MapPin size={11} /> 장소
            </span>
            <TextField placeholder="예) 교회 본당" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        {/* 배너 (상세 헤더) */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-semibold uppercase text-fg-muted" style={{ letterSpacing: "0.15em" }}>배너 (상세 헤더)</label>
          {shownBanner ? (
            <div className="relative">
              <label className="block cursor-pointer">
                <img src={shownBanner} alt="배너 미리보기" className="w-full object-cover rounded-field border border-line" style={{ height: 140 }} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBanner(f); }} />
              </label>
              {/* 사진 위에 얹히는 버튼이라 토큰이 아니라 raw 다 — 어떤 사진 위에서도 읽혀야 한다. */}
              <button type="button" onClick={removeBanner} aria-label="배너 삭제" className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition text-white" style={{ background: "rgba(23,23,28,0.55)" }}>
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1.5 w-full py-7 rounded-field cursor-pointer bg-card border-[1.5px] border-dashed border-line-strong">
              <Plus size={20} className="text-fg-faint" />
              <p className="text-caption font-semibold text-fg-muted">배너 업로드 (가로형)</p>
              <p className="text-micro text-fg-muted">없으면 대표 아이콘으로 표시돼요</p>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBanner(f); }} />
            </label>
          )}
        </div>

        {/* 포스터 */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-semibold uppercase text-fg-muted" style={{ letterSpacing: "0.15em" }}>포스터 (원본 비율)</label>
          {shownPoster ? (
            <div className="relative">
              <label className="block cursor-pointer">
                <img src={shownPoster} alt="포스터 미리보기" className="w-full h-auto rounded-field border border-line" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePoster(f); }} />
              </label>
              <button type="button" onClick={removePoster} aria-label="포스터 삭제" className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition text-white" style={{ background: "rgba(23,23,28,0.55)" }}>
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1.5 w-full py-7 rounded-field cursor-pointer bg-card border-[1.5px] border-dashed border-line-strong">
              <Plus size={20} className="text-fg-faint" />
              <p className="text-caption font-semibold text-fg-muted">포스터 업로드</p>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePoster(f); }} />
            </label>
          )}
        </div>

        {/* 추가 정보 (커스텀 필드) */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-semibold uppercase text-fg-muted" style={{ letterSpacing: "0.15em" }}>추가 정보</label>

          <AnimatePresence initial={false}>
            {fields.map((f) => (
              <motion.div key={f.key} className="flex flex-col gap-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold flex items-center gap-1 text-fg-muted">
                    <f.Icon size={11} /> {f.label}
                  </span>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeField(f.key)} aria-label="삭제" className="text-fg-faint">
                    <Trash2 size={13} />
                  </motion.button>
                </div>
                <TextField placeholder={`${f.label} 입력`} value={f.value} onChange={(e) => updateField(f.key, e.target.value)} />
              </motion.div>
            ))}
          </AnimatePresence>

          {addable.length > 0 && (
            <div className="relative">
              <motion.button
                className="w-full py-3 rounded-field flex items-center justify-center gap-2 text-body font-semibold bg-card border-[1.5px] border-dashed border-line-strong text-fg-muted"
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPicker((v) => !v)}
              >
                <Plus size={15} /> 필드 추가
                <motion.div animate={{ rotate: showPicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} />
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {showPicker && (
                  <motion.div
                    className="absolute left-0 right-0 rounded-field overflow-hidden mt-1 z-10 bg-card"
                    style={{ boxShadow: "var(--shadow-lift)" }}
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    {addable.map((opt, i) => (
                      <button
                        key={opt.key}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-body font-semibold text-left text-fg active:bg-sunken ${
                          i < addable.length - 1 ? "border-b border-line-soft" : ""
                        }`}
                        onClick={() => addField(opt)}
                      >
                        <opt.Icon size={15} className="text-fg-faint" />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
