import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Upload, X, Landmark, Pencil, Info, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../components/BackButton";
import TextField from "../../components/ui/TextField";
import SelectField from "../../components/ui/SelectField";
import { useReceiptUpload } from "../../hooks/useReceiptUpload";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { TAB_COLORS } from "../../constants/theme";
import { BANKS } from "../../constants/banks";

const ACCENT = TAB_COLORS.home;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-bold flex items-center gap-1" style={{ color: "#c0c8d4" }}>
      {children}
      {required && <span style={{ color: ACCENT, fontSize: 12 }}>*</span>}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs shrink-0" style={{ color: "#6b7785", width: 60 }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: "#f0f2f8" }}>{value}</span>
    </div>
  );
}

export default function MemberBillFormPage() {
  const navigate = useNavigate();
  const { user, userProfile, fetchUserProfile } = useAuthStore();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const { receiptFile, receiptPreview, handleReceiptChange, reset: resetReceipt } = useReceiptUpload();

  const hasAccount = !!(userProfile?.bank_name && userProfile?.account_number);
  const [editingAccount, setEditingAccount] = useState(!hasAccount);
  const [bank, setBank] = useState(userProfile?.bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState(userProfile?.account_number ?? "");
  const [saveForLater, setSaveForLater] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    !!title.trim() &&
    Number(amount) > 0 &&
    !!receiptFile &&
    (editingAccount ? !!bank && !!accountNumber.trim() : hasAccount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!canSubmit) {
      toast.error("제목·금액·영수증·계좌를 확인해주세요");
      return;
    }
    setSubmitting(true);
    try {
      const receiptUrl = await uploadReceipt(receiptFile!);
      const useBank = editingAccount ? bank : userProfile!.bank_name;
      const useNumber = editingAccount ? accountNumber.trim() : userProfile!.account_number;

      const { error } = await supabase.from("bills").insert({
        user_id: user.id,
        title: title.trim(),
        amount: Number(amount),
        receipt_url: receiptUrl,
        submitter_name: userProfile?.name,
        account_number: useNumber,
        bank_name: useBank,
      });
      if (error) throw error;

      if (editingAccount && saveForLater) {
        await supabase.from("user_profiles").update({
          bank_name: useBank,
          account_number: useNumber,
        }).eq("id", user.id);
        await fetchUserProfile().catch(() => {});
      }

      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "제출에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" style={{ background: "#0f1117" }}>
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: `${ACCENT}22` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <CheckCircle2 size={44} color={ACCENT} />
        </motion.div>
        <h2 className="text-2xl font-black mb-2" style={{ color: "#f0f2f8" }}>제출 완료!</h2>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#8892a0" }}>
          비용 청구서가 제출되었어요.<br />승인 후 계좌로 입금될 예정이에요.
        </p>
        <motion.button
          onClick={() => navigate("/home")}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-xs py-4 rounded-2xl font-black text-sm"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 6px 24px ${ACCENT}44` }}
        >
          홈으로 돌아가기
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "#0f1117" }}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 sticky top-0 z-10" style={{ background: "#0f1117", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <BackButton to="/home" />
        <h1 className="flex-1 text-base font-black" style={{ color: "#f0f2f8" }}>비용 청구서</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 flex flex-col gap-5" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        {/* 제목 */}
        <div className="flex flex-col gap-2">
          <FieldLabel required>제목</FieldLabel>
          <TextField placeholder="예) 7월 찬양팀 식사비" accent={ACCENT} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {/* 금액 */}
        <div className="flex flex-col gap-2">
          <FieldLabel required>금액</FieldLabel>
          <TextField type="number" inputMode="numeric" min={1} placeholder="0" suffix="원" accent={ACCENT} value={amount} onChange={(e) => setAmount(e.target.value)} />
          {Number(amount) > 0 && (
            <p className="text-xs pl-1" style={{ color: ACCENT }}>{Number(amount).toLocaleString()}원</p>
          )}
        </div>

        {/* 영수증 */}
        <div className="flex flex-col gap-2">
          <FieldLabel required>영수증 첨부</FieldLabel>
          {receiptPreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <img src={receiptPreview} alt="영수증" className="w-full max-h-56 object-cover" />
              <button
                type="button"
                onClick={resetReceipt}
                aria-label="영수증 삭제"
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition"
                style={{ background: "rgba(15,17,23,0.85)", color: "#fff" }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="w-full py-8 rounded-xl flex flex-col items-center gap-2 cursor-pointer active:scale-[0.99] transition" style={{ background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.12)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
                <Upload size={22} color={ACCENT} />
              </div>
              <p className="text-sm font-bold" style={{ color: "#c0c8d4" }}>이미지 업로드</p>
              <p className="text-xs" style={{ color: "#6b7785" }}>탭하여 영수증 사진을 첨부하세요</p>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReceiptChange(f); }} />
            </label>
          )}
        </div>

        {/* 계좌 정보 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Landmark size={17} color={ACCENT} />
              <span className="text-sm font-bold" style={{ color: "#f0f2f8" }}>계좌 정보</span>
            </div>
            {hasAccount && !editingAccount && (
              <button type="button" onClick={() => setEditingAccount(true)} className="flex items-center gap-1 text-xs font-bold" style={{ color: "#8892a0" }}>
                <Pencil size={13} /> 수정
              </button>
            )}
          </div>

          <div className="p-4 flex flex-col gap-3">
            {hasAccount && !editingAccount ? (
              <>
                <InfoRow label="은행" value={userProfile!.bank_name} />
                <InfoRow label="계좌번호" value={userProfile!.account_number} />
                <div className="flex items-center gap-1.5 mt-1">
                  <Info size={13} color={ACCENT} className="shrink-0" />
                  <p className="text-xs" style={{ color: "#6b7785" }}>저장된 계좌 정보를 사용해요.</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs pl-0.5" style={{ color: "#8892a0" }}>입금 받을 계좌 정보를 입력해 주세요.</p>
                <SelectField placeholder="은행 선택" options={BANKS} accent={ACCENT} value={bank} onChange={setBank} />
                <TextField placeholder="계좌번호 (- 없이 입력)" inputMode="numeric" accent={ACCENT} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ""))} />
                <label className="flex items-center gap-2.5 cursor-pointer mt-0.5">
                  <div
                    onClick={() => setSaveForLater((v) => !v)}
                    className="w-11 h-6 rounded-full relative transition-colors shrink-0"
                    style={{ background: saveForLater ? ACCENT : "rgba(255,255,255,0.12)" }}
                  >
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: saveForLater ? 22 : 2 }} />
                  </div>
                  <span className="text-sm" style={{ color: "#aab4c4" }}>계좌 정보 저장하기</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* 제출 */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl font-black text-sm mt-1 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}bb)`, color: "#0f1117", boxShadow: `0 6px 24px ${ACCENT}44` }}
        >
          {submitting ? "제출 중..." : "청구서 제출하기"}
        </motion.button>
      </form>
    </div>
  );
}
