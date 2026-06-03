// src/hooks/useReceiptParser.ts
import { useState } from "react";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ParsedReceipt {
  store_name: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  category: string;
}

export function useReceiptParser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = async (file: File): Promise<ParsedReceipt | null> => {
    setLoading(true);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type;

      const body = JSON.stringify({ base64, mediaType });
      console.log("body 길이:", body.length);
      console.log("mediaType:", mediaType);
      console.log("base64 앞부분:", base64?.slice(0, 50));

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dynamic-responder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mediaType }),
        }
      );

      if (!res.ok) throw new Error("분석 실패");

      console.log("status:", res.status);
      const data: ParsedReceipt = await res.json();
      console.log("response:", data);

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { parse, loading, error };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1024;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const resized = canvas.toDataURL("image/jpeg", 0.8);
      URL.revokeObjectURL(url);
      resolve(resized.split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}