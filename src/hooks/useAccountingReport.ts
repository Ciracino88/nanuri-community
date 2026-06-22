import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Report {
    id: string;
    period: string;
    total_income: number;
    total_expense: number;
}

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    memo: string;
    category: string;
}

interface CategoryTotal {
    name: string;
    type: string;
    total: number;
}

export function useAccountingReport(id: string | undefined) {
    const [report, setReport] = useState<Report | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        Promise.all([
            supabase.from("accounting_reports").select("*").eq("id", id).single(),
            supabase.from("accounting_transactions").select("*").eq("report_id", id).order("date"),
        ]).then(([{ data: reportData }, { data: txData }]) => {
            setReport(reportData);
            setTransactions(txData ?? []);
            setLoading(false);
        });
    }, [id]);

    const categoryTotals = transactions.reduce<Record<string, CategoryTotal>>((acc, t) => {
        if (!t.category) return acc;
        if (!acc[t.category]) acc[t.category] = { name: t.category, type: t.amount >= 0 ? "income" : "expense", total: 0 };
        acc[t.category].total += t.amount;
        return acc;
    }, {});

    const incomeTotals = Object.values(categoryTotals).filter((c) => c.type === "income");
    const expenseTotals = Object.values(categoryTotals).filter((c) => c.type === "expense");
    const totalIncome = incomeTotals.reduce((sum, c) => sum + c.total, 0);
    const totalExpense = expenseTotals.reduce((sum, c) => sum + c.total, 0);

    return { report, transactions, loading, incomeTotals, expenseTotals, totalIncome, totalExpense };
}
