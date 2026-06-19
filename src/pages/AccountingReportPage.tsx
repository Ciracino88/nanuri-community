import { useState } from "react";
import Papa from "papaparse";
import Button from "../components/ui/Button";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

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

const CATEGORIES = [
    "식비",
    "행사비",
    "시설비",
    "선물비",
    "참가비",
    "후원금",
    "이월금",
    "이자",
    "기타",
];

export default function AccountingReportPage() {
    const navigate = useNavigate();
    const { userProfile, signOut } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [period, setPeriod] = useState<string>("");

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
        setTransactions((prev) =>
        prev.map((t, i) => (i === index ? { ...t, category } : t))
        );
    };

    const categoryTotals = CATEGORIES.map((cat) => ({
        category: cat,
        total: transactions
        .filter((t) => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0),
    })).filter((c) => c.total !== 0);

    const totalExpense = transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    const handleDownloadSample = () => {
        const a = document.createElement("a");
        a.href = "/sample_account.csv";
        a.download = "sample_account.csv";
        a.click();
    };

    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar
            userName={userProfile?.name}
            onLogout={async () => { await signOut(); navigate("/"); }}
            onProfileEdit={() => navigate("/member/setup")}

        />
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">나누리 청년부</p>
                    <h1 className="text-xl font-medium text-gray-800">회계 보고서</h1>
                </div>
                {transactions.length > 0 && (
                    <div className="shrink-0">
                        <Button onClick={() => window.print()}>
                            PDF 저장
                        </Button>
                    </div>
                )}
            </div>

            {/* 샘플 CSV 다운로드 */}
            {transactions.length === 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700">샘플 파일로 먼저 체험해보세요</p>
                        <p className="text-xs text-gray-400 mt-0.5">토스뱅크 거래내역 형식의 샘플 CSV 파일이에요</p>
                    </div>
                    <button
                        onClick={handleDownloadSample}
                        className="text-sm text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition whitespace-nowrap"
                    >
                        샘플 다운로드 →
                    </button>
                </div>
            )}
            
            {transactions.length === 0 ? (
            <label className="flex flex-col items-center justify-center gap-2 w-full py-12 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <p className="text-gray-400 text-sm">토스뱅크 거래내역 CSV 업로드</p>
                <p className="text-gray-300 text-xs">CSV 파일만 지원</p>
                <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                }}
                />
            </label>
            ) : (
            <div className="flex flex-col gap-6">

                {/* 요약 */}
                <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs text-gray-400">조회기간</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{period}</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs text-gray-400">총 입금</p>
                    <p className="text-sm font-medium text-blue-500 mt-1">+{totalIncome.toLocaleString()}원</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-xs text-gray-400">총 출금</p>
                    <p className="text-sm font-medium text-red-500 mt-1">{totalExpense.toLocaleString()}원</p>
                </div>
                </div>

                {/* 카테고리별 합계 */}
                {categoryTotals.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">카테고리별 합계</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                    {categoryTotals.map((c) => (
                        <div key={c.category} className="flex items-center justify-between px-4 py-2.5">
                        <p className="text-sm text-gray-600">{c.category}</p>
                        <p className={`text-sm font-medium ${c.total < 0 ? "text-red-500" : "text-blue-500"}`}>
                            {c.total.toLocaleString()}원
                        </p>
                        </div>
                    ))}
                    </div>
                </div>
                )}

                {/* 잔액 */}
                {categoryTotals.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm font-medium text-blue-700">잔액</p>
                    <p className={`text-sm font-bold ${totalIncome + totalExpense >= 0 ? "text-blue-600" : "text-red-500"}`}>
                        {(totalIncome + totalExpense).toLocaleString()}원
                    </p>
                </div>
                )}

                {/* 거래내역 테이블 */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">거래내역</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">날짜</th>
                        <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">적요</th>
                        <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">메모</th>
                        <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">금액</th>
                        <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">카테고리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {transactions.map((t, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{t.date.slice(0, 10)}</td>
                            <td className="px-4 py-2.5 text-gray-700">{t.description}</td>
                            <td className="px-4 py-2.5 text-gray-500">{t.memo}</td>
                            <td className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${t.amount < 0 ? "text-red-500" : "text-blue-500"}`}>
                            {t.amount.toLocaleString()}원
                            </td>
                            <td className="px-4 py-2.5">
                                <span className="hidden print:inline text-xs text-gray-700">{t.category || "-"}</span>
                                <select
                                    value={t.category}
                                    onChange={(e) => updateCategory(i, e.target.value)}
                                    className="print:hidden text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                                >
                                    <option value="">선택</option>
                                    {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>

                <button
                onClick={() => {
                    setTransactions([]);
                    setPeriod("");
                }}
                className="text-sm text-gray-400 hover:text-gray-500 transition text-center"
                >
                다른 파일 업로드
                </button>
            </div>
            )}
        </div>
        </div>
    );
}