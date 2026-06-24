import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { useReceiptUpload } from "../../hooks/useReceiptUpload";
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import Input from "../../components/ui/Input";
import FileInput from "../../components/ui/FileInput";
import Button from "../../components/ui/Button";
import Navbar from "../../components/Navbar";
import SuccessScreen from "../../components/SuccessScreen";
import { supabase } from "../../lib/supabase";

interface FormValues {
  title: string;
  amount: number;
}

export default function MemberBillFormPage() {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();
  const { receiptFile, receiptPreview, handleReceiptChange, reset: resetReceipt } = useReceiptUpload();
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const { submitting, success, error, submit, reset: resetForm } = useFormSubmit();

  const onSubmit = async (values: FormValues) => {
    if (!receiptFile) {
      setReceiptError("영수증을 첨부해주세요");
      return;
    }
    setReceiptError(null);
    await submit(async () => {
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
    });
  };

  if (success) {
    return (
      <SuccessScreen
        message="청구서가 제출되었습니다"
        subMessage="담당자 확인 후 처리될 예정이에요"
        buttonText="메인 페이지로 돌아가기"
        onButtonClick={() => {
          resetForm();
          setReceiptError(null);
          reset();
          resetReceipt();
        }}
      />
    );
  }

  const hasAccount = !!(userProfile?.bank_name && userProfile?.account_number);

  if (!hasAccount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          userName={userProfile?.name}
          onLogout={async () => { await signOut(); navigate("/"); }}
          onProfileEdit={() => navigate("/member/setup")}
        />
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-1">나누리 청년부</p>
            <h1 className="text-xl font-medium text-gray-800">비용 청구서 작성</h1>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5 flex items-center gap-3 mb-5">
            <i className="ti ti-alert-circle text-amber-400 text-lg shrink-0" aria-hidden="true" />
            <p className="text-sm text-amber-700">청구서를 제출하려면 입금받을 계좌 정보가 필요해요</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/member/setup")}
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-4 flex items-center justify-between hover:border-gray-200 transition text-left"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-gray-800">프로필에 계좌 등록하기</p>
                <p className="text-xs text-gray-400">한 번 등록하면 다음부터 자동으로 입력돼요</p>
              </div>
              <i className="ti ti-chevron-right text-gray-300 text-lg shrink-0" aria-hidden="true" />
            </button>

            <button
              onClick={() => navigate("/guest/form")}
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-4 flex items-center justify-between hover:border-gray-200 transition text-left"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-gray-800">이번만 계좌 직접 입력하기</p>
                <p className="text-xs text-gray-400">등록 없이 이번 청구서에만 계좌를 입력해요</p>
              </div>
              <i className="ti ti-chevron-right text-gray-300 text-lg shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={userProfile?.name}
        onLogout={async () => { await signOut(); navigate("/"); }}
        onProfileEdit={() => navigate("/member/setup")}

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

          {(receiptError || error) && <p className="text-sm text-red-500 text-center">{receiptError ?? error}</p>}

          <Button type="submit" loading={submitting}>
            청구서 제출
          </Button>
        </form>
      </div>
    </div>
  );
}