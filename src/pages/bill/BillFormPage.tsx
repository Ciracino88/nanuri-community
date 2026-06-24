import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadReceipt } from "../../lib/uploadReceipt";
import { useReceiptUpload } from "../../hooks/useReceiptUpload";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import { useAuthStore } from "../../store/authStore";
import Input from "../../components/ui/Input";
import FileInput from "../../components/ui/FileInput";
import Button from "../../components/ui/Button";
import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import BankSelector from "../../components/BankSelector";
import SuccessScreen from "../../components/SuccessScreen";

interface FormValues {
  title: string;
  amount: number;
  account_number: string;
  bank_name: string;
  name: string;
}

export default function BillFormPage() {
  const navigate = useNavigate();
  const { isAnonymous } = useAuthStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>();
  const { receiptFile, receiptPreview, handleReceiptChange } = useReceiptUpload();
  const { submitting, success, error, submit } = useFormSubmit();

  const [receiptError, setReceiptError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    if (!receiptFile) {
      setReceiptError("영수증을 첨부해주세요");
      return;
    }
    setReceiptError(null);
    await submit(async () => {
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
    });
  };

  if (success) {
    return (
      <SuccessScreen
        message="청구서가 제출되었습니다"
        subMessage="담당자 확인 후 처리될 예정이에요"
        buttonText="메인 페이지로 돌아가기"
        onButtonClick={async () => {
          if (isAnonymous) {
            await supabase.auth.signOut();
            navigate("/");
          } else {
            navigate("/home");
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar isGuest />
      <PageContainer width="narrow">
        <div className="mb-6">
          <p className="text-caption text-fg-faint mb-1">나누리 청년부</p>
          <h1 className="text-title font-medium text-fg-strong">비용 청구서 작성</h1>
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
            {errors.bank_name && <p className="text-caption text-danger">{errors.bank_name.message}</p>}
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
            onChange={handleReceiptChange}
          />

          {(receiptError || error) && <p className="text-body text-danger text-center">{receiptError ?? error}</p>}

          <Button type="submit" loading={submitting}>
            청구서 제출
          </Button>
        </form>
      </PageContainer>
    </div>
  );
}