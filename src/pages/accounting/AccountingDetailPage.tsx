import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuthStore } from "../../store/authStore";
import LoadingScreen from "../../components/LoadingScreen";
import { useAccountingReport } from "../../hooks/useAccountingReport";

export default function AccountingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { userProfile, signOut } = useAuthStore();
    const { report, transactions, loading, incomeTotals, expenseTotals, totalIncome, totalExpense } = useAccountingReport(id);

    if (loading || !report) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar
                userName={userProfile?.name}
                onLogout={async () => { await signOut(); navigate("/"); }}
                onProfileEdit={() => navigate("/member/setup")}
            />
            <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

                <div className="flex items-center gap-3">
                    <button onClick={() => navigate("/accounting")} className="text-gray-300 hover:text-gray-500 transition">
                        <i className="ti ti-arrow-left text-lg" aria-hidden="true" />
                    </button>
                    <div className="flex-1">
                        <p className="text-xs text-gray-400">나누리 청년부</p>
                        <h1 className="text-xl font-medium text-gray-800">{report.period}</h1>
                    </div>
                    <button onClick={() => window.print()} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                        PDF 저장
                    </button>
                </div>

                {(incomeTotals.length > 0 || expenseTotals.length > 0) && (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-700">요약</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-100">
                            <div>
                                <div className="px-4 py-2 bg-blue-50 border-b border-gray-100">
                                    <p className="text-xs font-medium text-blue-500">수입</p>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {incomeTotals.map((c) => (
                                        <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
                                            <p className="text-sm text-gray-600">{c.name}</p>
                                            <p className="text-sm font-medium text-blue-500">{c.total.toLocaleString()}원</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                                        <p className="text-xs font-medium text-gray-500">총 수입</p>
                                        <p className="text-sm font-medium text-blue-600">+{totalIncome.toLocaleString()}원</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="px-4 py-2 bg-red-50 border-b border-gray-100">
                                    <p className="text-xs font-medium text-red-400">지출</p>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {expenseTotals.map((c) => (
                                        <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
                                            <p className="text-sm text-gray-600">{c.name}</p>
                                            <p className="text-sm font-medium text-red-500">{c.total.toLocaleString()}원</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                                        <p className="text-xs font-medium text-gray-500">총 지출</p>
                                        <p className="text-sm font-medium text-red-500">{totalExpense.toLocaleString()}원</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                            <p className="text-sm font-medium text-gray-700">잔액</p>
                            <p className={`text-sm font-bold ${totalIncome + totalExpense >= 0 ? "text-blue-600" : "text-red-500"}`}>
                                {(totalIncome + totalExpense).toLocaleString()}원
                            </p>
                        </div>
                    </div>
                )}

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
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{t.date.slice(0, 10)}</td>
                                        <td className="px-4 py-2.5 text-gray-700">{t.description}</td>
                                        <td className="px-4 py-2.5 text-gray-500">{t.memo}</td>
                                        <td className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${t.amount < 0 ? "text-red-500" : "text-blue-500"}`}>
                                            {t.amount.toLocaleString()}원
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-500">{t.category || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
