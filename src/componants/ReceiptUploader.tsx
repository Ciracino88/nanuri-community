// src/components/ReceiptUploader.tsx
import { useReceiptParser } from "../hooks/useReceiptParser";
import type { ParsedReceipt } from "../hooks/useReceiptParser";
import { useState } from "react";

export default function ReceiptUploader() {
  const { parse, loading, error } = useReceiptParser();
  const [result, setResult] = useState<ParsedReceipt | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parsed = await parse(file);
    if (parsed) setResult(parsed);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} />

      {loading && <p>분석 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          <h3>{result.store_name}</h3>
          <p>{result.date} {result.time}</p>
          <p>카테고리: {result.category}</p>
          <ul>
            {result.items.map((item, i) => (
              <li key={i}>{item.name} x{item.quantity} - {item.price.toLocaleString()}원</li>
            ))}
          </ul>
          <p>합계: {result.total.toLocaleString()}원</p>
          <p>결제수단: {result.payment_method}</p>
        </div>
      )}
    </div>
  );
}