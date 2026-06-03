// src/components/SuccessView.tsx
interface Props {
  onBack: () => void;
  backLabel?: string;
}

export default function SuccessView({ onBack, backLabel = "메인 페이지로 돌아가기" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-4xl">✅</p>
      <p className="text-lg font-medium text-gray-700">청구서가 제출되었습니다!</p>
      <p className="text-sm text-gray-400">담당자 확인 후 처리될 예정이에요</p>
      <button
        onClick={onBack}
        className="mt-4 px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
      >
        {backLabel}
      </button>
    </div>
  );
}