import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import Input from "../componants/ui/Input";
import Button from "../componants/ui/Button";
import BankSelector from "../componants/BankSelector";

interface FormValues {
  name: string;
  bank_name: string;
  account_number: string;
}

export default function MemberProfileSetupPage() {
  const navigate = useNavigate();
  const { user, fetchUserProfile } = useAuthStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    if (!user) return;

    await supabase.from("user_profiles").upsert({
      id: user.id,
      name: values.name,
      bank_name: values.bank_name,
      account_number: values.account_number,
    });

    await fetchUserProfile();
    setSubmitting(false);
    navigate("/member/form");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">나누리 청년부</p>
        <h1 className="text-xl font-medium text-gray-800">계좌 정보 등록</h1>
        <p className="text-sm text-gray-400 mt-1">환급받을 계좌 정보를 입력해주세요</p>
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
        <Button type="submit" loading={submitting}>
          등록하기
        </Button>
      </form>
    </div>
  );
}