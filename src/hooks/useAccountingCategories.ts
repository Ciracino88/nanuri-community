import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Category {
    id: string;
    name: string;
    type: "income" | "expense";
}

export function useAccountingCategories() {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        supabase
            .from("accounting_categories")
            .select("id, name, type")
            .order("type")
            .order("created_at")
            .then(({ data }) => setCategories((data ?? []) as Category[]));
    }, []);

    const addCategory = async (name: string, type: "income" | "expense") => {
        const { data, error } = await supabase
            .from("accounting_categories")
            .insert({ name: name.trim(), type })
            .select()
            .single();
        if (!error && data) setCategories((prev) => [...prev, data as Category]);
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("카테고리를 삭제할까요?")) return;
        const { error } = await supabase.from("accounting_categories").delete().eq("id", id);
        if (!error) setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    const incomeCategories = categories.filter((c) => c.type === "income");
    const expenseCategories = categories.filter((c) => c.type === "expense");

    return { categories, incomeCategories, expenseCategories, addCategory, deleteCategory };
}
