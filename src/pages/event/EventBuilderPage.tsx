import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, CalendarDays, Clock, MapPin, Users, DollarSign, Star, Pencil, Plus, ChevronDown, Trash2, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useReceiptUpload } from "../../hooks/useReceiptUpload";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { supabase } from "../../lib/supabase";
import { TAB_COLORS } from "../../constants/theme";

const ACCENT = TAB_COLORS.admin;

const CUSTOM_FIELD_OPTIONS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: "target", label: "대상", Icon: Users },
  { key: "cost", label: "비용", Icon: DollarSign },
  { key: "contact", label: "담당자", Icon: Star },
  { key: "note", label: "비고", Icon: Pencil },
];

const inputStyle: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#f0f2f8",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  width: "100%",
  outline: "none",
};
const dateStyle: CSSProperties = { ...inputStyle, colorScheme: "dark" };

interface CustomField { key: string; label: string; Icon: LucideIcon; value: string }

export default function EventBuilderPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [multiDay, setMultiDay] = useState(false);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const { receiptFile: posterFile, receiptPreview: posterPreview, handleReceiptChange: handlePoster, reset: resetPoster } = useReceiptUpload();

  const addable = CUSTOM_FIELD_OPTIONS.filter((o) => !fields.find((f) => f.key === o.key));
  const canSave = !!title.trim() && !!date && !!location.trim();

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
      let imageUrl: string | null = null;
      if (posterFile) imageUrl = await uploadReceipt(posterFile, "events");

      const details = fields.filter((f) => f.value.trim()).map((f) => ({ label: f.label, value: f.value.trim() }));

      const dots = (d: string) => d.replace(/-/g, ".");
      const eventDateStr = multiDay && endDate ? `${dots(date)}~${dots(endDate)}` : dots(date);

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          title: title.trim(),
          event_date: eventDateStr,
          start_time: time || null,
          place_name: location.trim(),
          image_url: imageUrl,
          details,
        })
        .select("id")
        .single();
      if (error) throw error;

      toast.success("행사를 만들었어요. 순서를 추가하세요");
      navigate(`/admin/events/${event.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sticky top-0 z-10" style={{ background: "#0f1117", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <motion.button
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          aria-label="뒤로"
        >
          <ChevronLeft size={18} color="#f0f2f8" />
        </motion.button>
        <h1 className="flex-1 text-base font-black" style={{ color: "#f0f2f8" }}>행사 추가</h1>
        <motion.button
          className="px-4 py-2 rounded-xl text-sm font-black"
          style={{ background: canSave ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT}99)` : "rgba(255,255,255,0.06)", color: canSave ? "#0f1117" : "#4a5568" }}
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
          <label className="text-xs font-bold uppercase" style={{ color: ACCENT, letterSpacing: "0.15em" }}>필수 정보</label>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>행사 제목</span>
            <input style={inputStyle} placeholder="예) 여름 수련회" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#6b7785" }}>
                <CalendarDays size={11} /> 날짜
              </span>
              <motion.button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: multiDay ? `${ACCENT}22` : "rgba(255,255,255,0.06)",
                  border: multiDay ? `1px solid ${ACCENT}44` : "1px solid rgba(255,255,255,0.1)",
                  color: multiDay ? ACCENT : "#4a5568",
                }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setMultiDay((v) => !v); setEndDate(""); }}
              >
                <CalendarDays size={10} />
                {multiDay ? "기간 선택 중" : "기간 설정"}
              </motion.button>
            </div>
            <AnimatePresence initial={false} mode="wait">
              {!multiDay ? (
                <motion.input key="single" type="date" style={dateStyle} value={date} onChange={(e) => setDate(e.target.value)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
              ) : (
                <motion.div key="range" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <input type="date" style={{ ...dateStyle, flex: 1 }} value={date} onChange={(e) => setDate(e.target.value)} />
                  <span className="text-xs font-bold shrink-0" style={{ color: "#4a5568" }}>–</span>
                  <input type="date" style={{ ...dateStyle, flex: 1 }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#6b7785" }}>
              <Clock size={11} /> 모이는 시각 (선택)
            </span>
            <input type="time" style={dateStyle} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#6b7785" }}>
              <MapPin size={11} /> 장소
            </span>
            <input style={inputStyle} placeholder="예) 교회 본당" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        {/* 포스터 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase" style={{ color: "#4a5568", letterSpacing: "0.15em" }}>포스터</label>
          {posterPreview ? (
            <div className="relative">
              <label className="block cursor-pointer">
                <img src={posterPreview} alt="포스터 미리보기" className="w-full h-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePoster(f); }} />
              </label>
              <button type="button" onClick={resetPoster} aria-label="포스터 삭제" className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1.5 w-full py-7 rounded-xl cursor-pointer" style={{ border: "1.5px dashed rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.03)" }}>
              <Plus size={20} color="#4a5568" />
              <p className="text-xs font-semibold" style={{ color: "#6b7785" }}>포스터 업로드</p>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePoster(f); }} />
            </label>
          )}
        </div>

        {/* 추가 정보 (커스텀 필드) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase" style={{ color: "#4a5568", letterSpacing: "0.15em" }}>추가 정보</label>

          <AnimatePresence initial={false}>
            {fields.map((f) => (
              <motion.div key={f.key} className="flex flex-col gap-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#6b7785" }}>
                    <f.Icon size={11} /> {f.label}
                  </span>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeField(f.key)} aria-label="삭제">
                    <Trash2 size={13} color="#4a5568" />
                  </motion.button>
                </div>
                <input style={inputStyle} placeholder={`${f.label} 입력`} value={f.value} onChange={(e) => updateField(f.key, e.target.value)} />
              </motion.div>
            ))}
          </AnimatePresence>

          {addable.length > 0 && (
            <div className="relative">
              <motion.button
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.12)", color: "#4a5568" }}
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
                    className="absolute left-0 right-0 rounded-xl overflow-hidden mt-1 z-10"
                    style={{ background: "rgba(22,25,35,0.98)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    {addable.map((opt, i) => (
                      <button
                        key={opt.key}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-left"
                        style={{ color: "#c0c8d4", borderBottom: i < addable.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                        onClick={() => addField(opt)}
                      >
                        <opt.Icon size={15} color="#4a5568" />
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
