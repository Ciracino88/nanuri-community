// src/pages/BillFormPage.tsx
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabase";

import Input from "../componants/ui/Input";
import FileInput from "../componants/ui/FileInput";
import Button from "../componants/ui/Button";
import Navbar from "../componants/Navbar";
import BankSelector from "../componants/BankSelector";

interface FormValues {
  title: string;
  amount: number;
  account_number: string;
  bank_name: string;
  name: string;
  receipt: FileList;
}

export default function BillFormPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");

  const uploadReceipt = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${import.meta.env.VITE_CF_WORKER_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("영수증 업로드 실패");
    const { url } = await res.json();
    return url;
  };

  const onSubmit = async (values: FormValues) => {
    if (!receiptFile) return;
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
        submitter_name: values.name,
        account_number: values.account_number,
        bank_name: values.bank_name,
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
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-4xl">✅</p>
        <p className="text-lg font-medium text-gray-700">청구서가 제출되었습니다!</p>
        <p className="text-sm text-gray-400">담당자 확인 후 처리될 예정이에요</p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/");
          }}
          className="mt-4 px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
        >
          메인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        isGuest
        onHome={async () => {
          await supabase.auth.signOut();
          navigate("/");
        }}
      />
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">나누리 청년부</p>
          <h1 className="text-xl font-medium text-gray-800">비용 청구서 작성</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            label="이름"
            placeholder="홍길동"
            error={errors.name?.message}
            {...register("name", { required: "이름을 입력해주세요" })}
          />

          <div className="flex flex-col gap-1.5">
            <BankSelector
              value={watch("bank_name")}
              onChange={(bank) => setValue("bank_name", bank, { shouldValidate: true })}
            />
            <input type="hidden" {...register("bank_name", { required: "은행을 선택해주세요" })} />
            {errors.bank_name && <p className="text-xs text-red-500">{errors.bank_name.message}</p>}
          </div>

          <Input
            label="계좌번호"
            placeholder="계좌번호를 입력하세요"
            inputMode="numeric"
            error={errors.account_number?.message}
            {...register("account_number", { required: "계좌번호를 입력해주세요" })}
          />

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
            onChange={(file) => {
              setReceiptFile(file);
              setReceiptPreview(URL.createObjectURL(file));
            }}
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