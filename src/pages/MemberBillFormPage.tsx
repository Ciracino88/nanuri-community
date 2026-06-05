import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { uploadReceipt } from "../lib/uploadReceipt";
import { useReceiptUpload } from "../hooks/useReceiptUpload";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import Input from "../components/ui/Input";
import FileInput from "../components/ui/FileInput";
import Button from "../components/ui/Button";
import Navbar from "../components/Navbar";
import SuccessView from "../components/SuccessView";

interface FormValues {
  title: string;
  amount: number;
}

export default function MemberBillFormPage() {
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();
  const { receiptFile, receiptPreview, handleReceiptChange, reset: resetReceipt } = useReceiptUpload();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    if (!receiptFile) {
      setError("영수증을 첨부해주세요");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const receiptUrl = await uploadReceipt(receiptFile);

      const { error: billError } = await supabase.from("bills").insert({
        user_id: user.id,
        title: values.title,
        amount: Number(values.amount),
        receipt_url: receiptUrl,
        submitter_name: userProfile?.name,
        account_number: userProfile?.account_number,
        bank_name: userProfile?.bank_name,
      });

      if (billError) throw billError;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SuccessView
        onBack={() => {
          setSuccess(false);
          setError(null);
          reset();
          resetReceipt();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={userProfile?.name}
        onLogout={async () => { await signOut(); navigate("/"); }}
        onProfileEdit={() => navigate("/member/setup")}
        onHome={() => navigate("/member/form")}
      />
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">나누리 청년부</p>
          <h1 className="text-xl font-medium text-gray-800">비용 청구서 작성</h1>
          {userProfile && (
            <p className="text-sm text-gray-500 mt-1">{userProfile.name}님, 안녕하세요</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-gray-400">입금 계좌</p>
                <p className="text-sm font-medium text-gray-700">
                  {userProfile?.bank_name} {userProfile?.account_number}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/member/setup")}
              className="text-xs text-blue-400 hover:text-blue-500 transition text-right pr-1"
            >
              계좌 정보가 다른가요? 수정하기 →
            </button>
          </div>

          <Input
            label="제목"
            placeholder="예) 주일 행사 다과 구입"
            error={errors.title?.message}
            {...register("title", { required: "제목을 입력해주세요" })}
          />

          <Input
            label="금액"
            type="number"
            placeholder="0"
            inputMode="numeric"
            error={errors.amount?.message}
            {...register("amount", { required: "금액을 입력해주세요", min: { value: 1, message: "금액을 입력해주세요" } })}
          />

          <FileInput
            label="영수증"
            preview={receiptPreview}
            onChange={handleReceiptChange}
          />

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button type="submit" loading={submitting}>
            청구서 제출
          </Button>
        </form>
      </div>
    </div>
  );
}