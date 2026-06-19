import { useState } from "react";

interface UseFormSubmitResult {
  submitting: boolean;
  success: boolean;
  error: string | null;
  submit: (fn: () => Promise<void>) => Promise<void>;
  reset: () => void;
}

export function useFormSubmit(): UseFormSubmitResult {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (fn: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    try {
      await fn();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmitting(false);
    setSuccess(false);
    setError(null);
  };

  return { submitting, success, error, submit, reset };
}
