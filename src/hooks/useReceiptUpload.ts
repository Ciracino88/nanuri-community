// src/hooks/useReceiptUpload.ts
import { useState } from "react";

export function useReceiptUpload() {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");

  const handleReceiptChange = (file: File) => {
    setReceiptPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setReceiptFile(file);
  };

  const reset = () => {
    setReceiptPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setReceiptFile(null);
  };

  return { receiptFile, receiptPreview, handleReceiptChange, reset };
}