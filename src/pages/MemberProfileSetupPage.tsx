import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { Pencil } from "lucide-react";
import BackButton from "../components/BackButton";
import TextField from "../components/ui/TextField";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { uploadReceipt } from "../lib/uploadReceipt";
import { POSITIONS } from "../constants/worship";

const ACCENT = "#74C7FF";
const BANKS = [
  "카카오뱅크", "토스뱅크", "신한은행", "KB국민은행",
  "하나은행", "우리은행", "IBK기업은행", "NH농협은행",
  "새마을금고", "신협", "K뱅크", "iM뱅크",
];

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#f0f2f8",
  borderRadius: 12,
};

interface FormValues {
  name: string;
  account_number: string;
  phone: string;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#8892a0" }}>
      {children}
    </label>
  );
}

export default function MemberProfileSetupPage() {
  const navigate = useNavigate();
  const { user, userProfile, fetchUserProfile } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: userProfile?.name ?? "",
      account_number: userProfile?.account_number ?? "",
      phone: userProfile?.phone ?? "",
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState<string[]>(userProfile?.position ?? []);
  const [team, setTeam] = useState<string>(userProfile?.team ?? "나누리");
  const [bank, setBank] = useState<string>(userProfile?.bank_name ?? "");
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const togglePosition = (pos: string) =>
    setPositions((prev) => (prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]));

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setSubmitting(true);

    let avatar_url = userProfile?.avatar_url ?? null;
    if (avatarFile) avatar_url = await uploadReceipt(avatarFile, "avatars");

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      name: values.name,
      team,
      position: positions.length > 0 ? positions : null,
      bank_name: bank || null,
      account_number: values.account_number || null,
      phone: values.phone || null,
      avatar_url,
    });

    if (error) {
      console.error("[MemberProfileSetupPage] upsert error:", error);
      setSubmitting(false);
      toast.error("저장에 실패했어요");
      return;
    }

    await fetchUserProfile().catch(() => {});
    setSubmitting(false);
    toast.success("저장되었어요!", { icon: "✅" });
    navigate("/profile");
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>

      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-base font-extrabold text-white flex-1">프로필 편집</h1>
        <div className="w-9" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md mx-auto px-4 py-5 flex flex-col gap-5"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >

        {/* 프로필 사진 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <motion.button
              type="button"
              onClick={() => fileRef.current?.click()}
              whileTap={{ scale: 0.95 }}
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl overflow-hidden"
              style={{ border: `3px solid ${ACCENT}`, background: `${ACCENT}22` }}
            >
              {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : "🐹"}
            </motion.button>
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${ACCENT}` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: ACCENT }}
              aria-label="사진 변경"
            >
              <Pencil size={13} color="#0f1117" />
            </button>
          </div>
          <p className="text-xs" style={{ color: "#8892a0" }}>탭해서 사진 변경</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* 이름 */}
        <div className="flex flex-col gap-2">
          <FieldLabel>이름</FieldLabel>
          <TextField
            placeholder="이름을 입력하세요"
            error={errors.name?.message}
            accent={ACCENT}
            {...register("name", { required: "이름을 입력해주세요" })}
          />
        </div>

        {/* 팀 */}
        <div className="flex flex-col gap-2">
          <FieldLabel>팀</FieldLabel>
          <div className="flex gap-2">
            {["나누리", "섬김이"].map((t) => (
              <motion.button
                key={t}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setTeam(t)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold"
                animate={team === t ? { background: ACCENT, color: "#0f1117" } : { background: "rgba(255,255,255,0.06)", color: "#8892a0" }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                {t}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 포지션 */}
        <div className="flex flex-col gap-2">
          <FieldLabel>
            포지션 <span style={{ color: `${ACCENT}99` }}>({positions.length}개 선택)</span>
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => {
              const selected = positions.includes(pos);
              return (
                <motion.button
                  key={pos}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => togglePosition(pos)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold"
                  style={{ border: "1px solid" }}
                  animate={
                    selected
                      ? { background: `${ACCENT}33`, color: ACCENT, borderColor: `${ACCENT}88` }
                      : { background: "rgba(255,255,255,0.05)", color: "#8892a0", borderColor: "rgba(255,255,255,0.1)" }
                  }
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {pos}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 은행 정보 */}
        <div className="flex flex-col gap-2">
          <FieldLabel>은행 정보</FieldLabel>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBankPicker((v) => !v)}
            className="w-full px-4 py-3 text-sm font-bold text-left flex items-center justify-between"
            style={inputStyle}
          >
            <span style={{ color: bank ? "white" : "#8892a0" }}>{bank || "은행 선택"}</span>
            <motion.span animate={{ rotate: showBankPicker ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: "#8892a0" }}>▾</motion.span>
          </motion.button>

          <AnimatePresence>
            {showBankPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {BANKS.map((b, i) => (
                  <button
                    key={b}
                    type="button"
                    className="w-full px-4 py-2.5 text-sm font-semibold text-left"
                    style={{ color: bank === b ? ACCENT : "#c0c8d8", borderBottom: i < BANKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    onClick={() => { setBank(b); setShowBankPicker(false); }}
                  >
                    {bank === b && <span className="mr-2">✓</span>}
                    {b}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <TextField
            inputMode="numeric"
            placeholder="계좌번호를 입력하세요"
            accent={ACCENT}
            {...register("account_number")}
          />
        </div>

        {/* 연락처 */}
        <div className="flex flex-col gap-2">
          <FieldLabel>연락처</FieldLabel>
          <TextField
            type="tel"
            placeholder="010-0000-0000"
            accent={ACCENT}
            {...register("phone")}
          />
        </div>

        {/* 저장 */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.96 }}
          className="w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 6px 24px ${ACCENT}44` }}
        >
          {submitting ? "저장 중..." : "저장하기"}
        </motion.button>

      </form>
    </div>
  );
}
