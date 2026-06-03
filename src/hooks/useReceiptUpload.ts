// src/hooks/useReceiptUpload.ts
import { useState } from "react";

export function useReceiptUpload() {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");

  const handleReceiptChange = (file: File) => {
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const reset = () => {
    setReceiptFile(null);
    setReceiptPreview("");
  };

  return { receiptFile, receiptPreview, handleReceiptChange, reset };
}