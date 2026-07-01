import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CreditCard, Plus, Trash2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../components/BackButton";
import TextField from "../../components/ui/TextField";
import { useReceiptUpload } from "../../hooks/useReceiptUpload";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { TAB_COLORS } from "../../constants/theme";

const ACCENT = TAB_COLORS.home;

interface FormValues {
  title: string;
  amount: number;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold" style={{ color: "#6b7785" }}>{children}</span>;
}

export default function MemberBillFormPage() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const { receiptFile, receiptPreview, handleReceiptChange, reset: resetReceipt } = useReceiptUpload();
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasAccount = !!(userProfile?.bank_name && userProfile?.account_number);

  const onSubmit = async (values: FormValues) => {
    if (!receiptFile) {
      setReceiptError("영수증을 첨부해주세요");
      return;
    }
    setReceiptError(null);
    if (!user) return;
    setSubmitting(true);
    try {
      const receiptUrl = await uploadReceipt(receiptFile);
      const { error } = await supabase.from("bills").insert({
        user_id: user.id,
        title: values.title.trim(),
        amount: Number(values.amount),
        receipt_url: receiptUrl,
        submitter_name: userProfile?.name,
        account_number: userProfile?.account_number,
        bank_name: userProfile?.bank_name,
      });
      if (error) throw error;
      toast.success("청구서를 제출했어요", { icon: "🧾" });
      navigate("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "제출에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sticky top-0 z-10" style={{ background: "#0f1117", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <BackButton to="/home" />
        <h1 className="flex-1 text-base font-black" style={{ color: "#f0f2f8" }}>청구서 작성</h1>
      </div>

      {!hasAccount ? (
        // 계좌 정보 없음 안내
        <div className="px-4 pt-6 flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
              <CreditCard size={28} color={ACCENT} />
            </div>
            <p className="text-sm text-center leading-relaxed" style={{ color: "#8892a0" }}>
              청구서를 제출하려면<br />입금받을 계좌 정보가 필요해요
            </p>
          </div>
          <button
            onClick={() => navigate("/member/setup")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left active:scale-[0.99] transition"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: "#f0f2f8" }}>프로필에 계좌 등록하기</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b7785" }}>한 번 등록하면 다음부터 자동으로 입력돼요</p>
            </div>
            <ChevronRight size={18} color={ACCENT} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-4 pt-5 flex flex-col gap-5"
          style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        >
          {/* 입금 계좌 */}
          <div className="flex items-center justify-between rounded-2xl px-4 py-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="min-w-0">
              <p className="text-xs" style={{ color: "#6b7785" }}>입금 계좌</p>
              <p className="text-sm font-bold mt-0.5 truncate" style={{ color: "#f0f2f8" }}>
                {userProfile?.bank_name} {userProfile?.account_number}
              </p>
            </div>
            <button type="button" onClick={() => navigate("/member/setup")} className="text-xs font-bold shrink-0 ml-3" style={{ color: ACCENT }}>
              수정
            </button>
          </div>

          {/* 제목 */}
          <TextField
            label="제목"
            placeholder="예) 주일 행사 다과 구입"
            error={errors.title?.message}
            accent={ACCENT}
            {...register("title", { required: "제목을 입력해주세요" })}
          />

          {/* 금액 */}
          <TextField
            label="금액"
            type="number"
            inputMode="numeric"
            placeholder="0"
            error={errors.amount?.message}
            accent={ACCENT}
            {...register("amount", { required: "금액을 입력해주세요", min: { value: 1, message: "금액을 입력해주세요" } })}
          />

          {/* 영수증 */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>영수증</FieldLabel>
            {receiptPreview ? (
              <div className="relative">
                <label className="block cursor-pointer">
                  <img src={receiptPreview} alt="영수증 미리보기" className="w-full h-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleReceiptChange(f); setReceiptError(null); } }} />
                </label>
                <button type="button" onClick={resetReceipt} aria-label="영수증 삭제" className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 w-full py-7 rounded-xl cursor-pointer" style={{ border: "1.5px dashed rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.03)" }}>
                <Plus size={20} color="#4a5568" />
                <p className="text-xs font-semibold" style={{ color: "#6b7785" }}>영수증 업로드</p>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleReceiptChange(f); setReceiptError(null); } }} />
              </label>
            )}
            {receiptError && <p className="text-xs" style={{ color: "#FF6B6B" }}>{receiptError}</p>}
          </div>

          {/* 제출 */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-black text-sm mt-1 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 6px 24px ${ACCENT}44` }}
          >
            {submitting ? "제출 중..." : "청구서 제출"}
          </motion.button>
        </form>
      )}
    </div>
  );
}
