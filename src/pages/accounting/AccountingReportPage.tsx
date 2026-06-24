import { useState } from "react";
import Papa from "papaparse";
import Button from "../../components/ui/Button";
import Navbar from "../../components/Navbar";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAccountingCategories } from "../../hooks/useAccountingCategories";

interface Transaction {
    date: string;
    description: string;
    type: string;
    bank: string;
    account: string;
    amount: number;
    balance: string;
    memo: string;
    category: string;
}

export default function AccountingReportPage() {
    const navigate = useNavigate();
    const { userProfile, signOut } = useAuthStore();
    const { categories, incomeCategories, expenseCategories, addCategory, deleteCategory } = useAccountingCategories();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [period, setPeriod] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleFileUpload = (file: File) => {
        Papa.parse(file, {
            encoding: "UTF-8",
            complete: (result) => {
                const rows = result.data as string[][];
                const periodRow = rows[3];
                if (periodRow) setPeriod(periodRow[1] ?? "");
                const dataRows = rows.slice(9).filter((row) => row[0] && row[0].trim() !== "");
                const parsed: Transaction[] = dataRows.map((row) => ({
                    date: row[0] ?? "",
                    description: row[1] ?? "",
                    type: row[2] ?? "",
                    bank: row[3] ?? "",
                    account: row[4] ?? "",
                    amount: Number((row[5] ?? "0").replace(/[^-0-9]/g, "")),
                    balance: row[6] ?? "",
                    memo: row[7] ?? "",
                    category: "",
                }));
                setTransactions(parsed);
            },
        });
    };

    const updateCategory = (index: number, category: string) => {
        setTransactions((prev) => prev.map((t, i) => (i === index ? { ...t, category } : t)));
    };

    const handleSave = async () => {
        const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);

        const { data: report, error: reportError } = await supabase
            .from("accounting_reports")
            .insert({ title: title.trim() || period, period, total_income: totalIncome, total_expense: totalExpense })
            .select()
            .single();
        if (reportError) { alert("저장 실패"); return; }

        const { error: txError } = await supabase.from("accounting_transactions").insert(
            transactions.map((t) => ({ ...t, report_id: report.id }))
        );
        if (txError) { alert("거래내역 저장 실패"); return; }

        alert("저장되었습니다.");
        navigate("/accounting");
    };

    const categoryTotals = categories.map((cat) => ({
        ...cat,
        total: transactions.filter((t) => t.category === cat.name).reduce((sum, t) => sum + t.amount, 0),
    })).filter((c) => c.total !== 0);

    const totalExpense = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const incomeTotals = categoryTotals.filter((c) => c.type === "income");
    const expenseTotals = categoryTotals.filter((c) => c.type === "expense");

    const handleDownloadSample = () => {
        const a = document.createElement("a");
        a.href = "/sample_account.csv";
        a.download = "sample_account.csv";
        a.click();
    };

    return (
        <div className="min-h-screen bg-surface">
            <Navbar
                userName={userProfile?.name}
                onLogout={async () => { await signOut(); navigate("/"); }}
                onProfileEdit={() => navigate("/member/setup")}
            />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 flex flex-col gap-2">
                        <button onClick={() => navigate("/accounting")} className="text-fg-faint hover:text-fg-muted transition w-fit">
                            <i className="ti ti-arrow-left text-heading" aria-hidden="true" />
                        </button>
                        <input
                            type="text"
                            placeholder="장부 제목 (예: 2025년 1월)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-title font-medium text-fg-strong bg-transparent outline-none border-b border-line focus:border-line-strong pb-1 transition placeholder:text-fg-faint placeholder:font-normal placeholder:text-emphasis"
                        />
                    </div>
                </div>

                {transactions.length === 0 && (
                    <div className="flex items-center justify-between bg-card rounded-xl border border-line-soft px-4 py-3 mb-4">
                        <div>
                            <p className="text-body font-medium text-fg">샘플 파일로 먼저 체험해보세요</p>
                            <p className="text-caption text-fg-faint mt-0.5">토스뱅크 거래내역 형식의 샘플 CSV 파일이에요</p>
                        </div>
                        <button onClick={handleDownloadSample} className="text-body text-info px-3 py-1.5 rounded-lg hover:bg-info-subtle transition whitespace-nowrap">
                            샘플 다운로드 →
                        </button>
                    </div>
                )}

                {transactions.length === 0 ? (
                    <label className="flex flex-col items-center justify-center gap-2 w-full py-12 border-2 border-dashed border-line rounded-xl cursor-pointer hover:bg-surface transition">
                        <p className="text-fg-faint text-body">토스뱅크 거래내역 CSV 업로드</p>
                        <p className="text-fg-faint text-caption">CSV 파일만 지원</p>
                        <input type="file" accept=".csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
                    </label>
                ) : (
                    <div className="flex flex-col gap-6">
                        {categoryTotals.length > 0 && (
                            <div className="bg-card rounded-xl border border-line-soft overflow-hidden">
                                <div className="px-4 py-3 border-b border-line-soft">
                                    <p className="text-body font-medium text-fg">카테고리별 합계</p>
                                </div>
                                <div className="divide-y divide-line-soft">
                                    {categoryTotals.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-caption px-2 py-0.5 rounded-full ${c.type === "income" ? "bg-info-subtle text-info" : "bg-danger-subtle text-danger"}`}>
                                                    {c.type === "income" ? "수입" : "지출"}
                                                </span>
                                                <p className="text-body text-fg">{c.name}</p>
                                            </div>
                                            <p className={`text-body font-medium ${c.total < 0 ? "text-danger" : "text-info"}`}>
                                                {c.total.toLocaleString()}원
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {categoryTotals.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-info-subtle rounded-xl border border-info-soft">
                                <p className="text-body font-medium text-info">잔액</p>
                                <p className={`text-body font-bold ${totalIncome + totalExpense >= 0 ? "text-info" : "text-danger"}`}>
                                    {(totalIncome + totalExpense).toLocaleString()}원
                                </p>
                            </div>
                        )}

                        <div className="bg-card rounded-xl border border-line-soft overflow-hidden">
                            <div className="px-4 py-3 border-b border-line-soft">
                                <p className="text-body font-medium text-fg">거래내역</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-body">
                                    <thead className="bg-surface">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 text-caption text-fg-faint font-medium">날짜</th>
                                            <th className="text-left px-4 py-2.5 text-caption text-fg-faint font-medium">적요</th>
                                            <th className="text-left px-4 py-2.5 text-caption text-fg-faint font-medium">메모</th>
                                            <th className="text-right px-4 py-2.5 text-caption text-fg-faint font-medium">금액</th>
                                            <th className="text-left px-4 py-2.5 text-caption text-fg-faint font-medium">카테고리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line-soft">
                                        {transactions.map((t, i) => {
                                            const relevantCategories = t.amount >= 0 ? incomeCategories : expenseCategories;
                                            return (
                                                <tr key={i} className="hover:bg-surface">
                                                    <td className="px-4 py-2.5 text-fg whitespace-nowrap">{t.date.slice(0, 10)}</td>
                                                    <td className="px-4 py-2.5 text-fg">{t.description}</td>
                                                    <td className="px-4 py-2.5">
                                                        <input
                                                            type="text"
                                                            value={t.memo}
                                                            onChange={(e) => setTransactions((prev) => prev.map((tx, idx) => idx === i ? { ...tx, memo: e.target.value } : tx))}
                                                            className="w-full text-body text-fg-muted bg-transparent outline-none border-b border-transparent hover:border-line focus:border-line-strong transition"
                                                        />
                                                    </td>
                                                    <td className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${t.amount < 0 ? "text-danger" : "text-info"}`}>
                                                        {t.amount.toLocaleString()}원
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className="hidden print:inline text-caption text-fg">{t.category || "-"}</span>
                                                        <select
                                                            value={t.category}
                                                            onChange={(e) => updateCategory(i, e.target.value)}
                                                            className="print:hidden text-caption border border-line rounded-lg px-2 py-1 outline-none focus:border-info"
                                                        >
                                                            <option value="">선택</option>
                                                            {relevantCategories.map((cat) => (
                                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <button
                            onClick={() => { setTransactions([]); setPeriod(""); }}
                            className="text-body text-fg-faint hover:text-fg-muted transition text-center"
                        >
                            다른 파일 업로드
                        </button>

                        <Button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={transactions.some((t) => !t.category)}
                        >
                            저장
                        </Button>
                    </div>
                )}
            </div>

        {/* 저장 확인 모달 */}
        {showConfirmModal && (
            <div
                className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4"
                onClick={() => setShowConfirmModal(false)}
            >
                <div
                    className="bg-card w-full max-w-lg rounded-2xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-body font-medium text-fg-strong">저장 전 최종 확인</p>
                        <button onClick={() => setShowConfirmModal(false)} className="text-fg-faint hover:text-fg transition">
                            <i className="ti ti-x text-heading" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="rounded-xl border border-line-soft overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-line-soft">
                            <p className="text-caption font-medium text-fg-muted">요약</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-line-soft">
                            <div>
                                <div className="px-3 py-1.5 bg-info-subtle border-b border-line-soft">
                                    <p className="text-caption font-medium text-info">수입</p>
                                </div>
                                <div className="divide-y divide-line-soft">
                                    {incomeTotals.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between px-3 py-2">
                                            <p className="text-caption text-fg">{c.name}</p>
                                            <p className="text-caption font-medium text-info">{c.total.toLocaleString()}원</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-3 py-2 bg-surface">
                                        <p className="text-caption font-medium text-fg-muted">총 수입</p>
                                        <p className="text-caption font-medium text-info">+{totalIncome.toLocaleString()}원</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="px-3 py-1.5 bg-danger-subtle border-b border-line-soft">
                                    <p className="text-caption font-medium text-danger">지출</p>
                                </div>
                                <div className="divide-y divide-line-soft">
                                    {expenseTotals.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between px-3 py-2">
                                            <p className="text-caption text-fg">{c.name}</p>
                                            <p className="text-caption font-medium text-danger">{c.total.toLocaleString()}원</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-3 py-2 bg-surface">
                                        <p className="text-caption font-medium text-fg-muted">총 지출</p>
                                        <p className="text-caption font-medium text-danger">{totalExpense.toLocaleString()}원</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-line-soft bg-surface">
                            <p className="text-caption font-medium text-fg">잔액</p>
                            <p className={`text-caption font-bold ${totalIncome + totalExpense >= 0 ? "text-info" : "text-danger"}`}>
                                {(totalIncome + totalExpense).toLocaleString()}원
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 text-body text-fg-muted py-2.5 rounded-xl border border-line hover:bg-surface transition"
                        >
                            취소
                        </button>
                        <button
                            onClick={async () => { setShowConfirmModal(false); await handleSave(); }}
                            className="flex-1 text-body text-white bg-inverse py-2.5 rounded-xl hover:bg-inverse transition font-medium"
                        >
                            저장하기
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 플로팅 버튼 */}
        <button
            onClick={() => setShowCategoryModal(true)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-inverse text-white flex items-center justify-center shadow-lg hover:bg-inverse transition z-30"
            title="카테고리 관리"
        >
            <i className="ti ti-tag text-title" aria-hidden="true" />
        </button>

        {/* 카테고리 모달 */}
        {showCategoryModal && (
            <div
                className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4"
                onClick={() => setShowCategoryModal(false)}
            >
                <div
                    className="bg-card w-full max-w-lg rounded-2xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-body font-medium text-fg-strong">카테고리 관리</p>
                        <button onClick={() => setShowCategoryModal(false)} className="text-fg-faint hover:text-fg transition">
                            <i className="ti ti-x text-heading" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={newCategoryType}
                            onChange={(e) => setNewCategoryType(e.target.value as "income" | "expense")}
                            className="text-body border border-line rounded-lg px-2 py-1.5 outline-none focus:border-info"
                        >
                            <option value="income">수입</option>
                            <option value="expense">지출</option>
                        </select>
                        <input
                            type="text"
                            placeholder="카테고리 이름"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { addCategory(newCategoryName, newCategoryType); setNewCategoryName(""); } }}
                            className="flex-1 text-body border border-line rounded-lg px-3 py-1.5 outline-none focus:border-info"
                        />
                        <button
                            onClick={() => { addCategory(newCategoryName, newCategoryType); setNewCategoryName(""); }}
                            className="text-body text-info px-3 py-1.5 rounded-lg border border-info-soft hover:bg-info-subtle transition"
                        >
                            추가
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {(["income", "expense"] as const).map((type) => (
                            <div key={type}>
                                <p className="text-caption text-fg-faint mb-2">{type === "income" ? "수입" : "지출"}</p>
                                <div className="flex flex-col gap-1">
                                    {(type === "income" ? incomeCategories : expenseCategories).map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between px-3 py-1.5 bg-surface rounded-lg">
                                            <span className="text-body text-fg">{cat.name}</span>
                                            <button onClick={() => deleteCategory(cat.id)} className="text-fg-faint hover:text-danger transition">
                                                <i className="ti ti-x text-caption" aria-hidden="true" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        </div>
    );
}
