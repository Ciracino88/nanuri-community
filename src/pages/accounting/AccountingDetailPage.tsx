import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import LoadingScreen from "../../components/LoadingScreen";
import { useAccountingReport } from "../../hooks/useAccountingReport";

export default function AccountingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { report, transactions, loading, incomeTotals, expenseTotals, totalIncome, totalExpense } = useAccountingReport(id);

    if (loading || !report) return <LoadingScreen />;

    return (
        <PageContainer width="full">

                <div className="flex items-center gap-3">
                    <button onClick={() => navigate("/accounting")} className="text-fg-faint hover:text-fg-muted transition">
                        <i className="ti ti-arrow-left text-heading" aria-hidden="true" />
                    </button>
                    <div className="flex-1">
                        <p className="text-caption text-fg-faint">나누리 청년부</p>
                        <h1 className="text-title font-medium text-fg-strong">{report.period}</h1>
                    </div>
                    <button onClick={() => window.print()} className="text-body text-fg-muted px-3 py-1.5 rounded-lg border border-line hover:bg-surface transition">
                        PDF 저장
                    </button>
                </div>

                {(incomeTotals.length > 0 || expenseTotals.length > 0) && (
                    <div className="bg-card rounded-xl border border-line-soft overflow-hidden">
                        <div className="px-4 py-3 border-b border-line-soft">
                            <p className="text-body font-medium text-fg">요약</p>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-line-soft">
                            <div>
                                <div className="px-4 py-2 bg-info-subtle border-b border-line-soft">
                                    <p className="text-caption font-medium text-info">수입</p>
                                </div>
                                <div className="divide-y divide-line-soft">
                                    {incomeTotals.map((c) => (
                                        <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
                                            <p className="text-body text-fg">{c.name}</p>
                                            <p className="text-body font-medium text-info">{c.total.toLocaleString()}원</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-surface">
                                        <p className="text-caption font-medium text-fg-muted">총 수입</p>
                                        <p className="text-body font-medium text-info">+{totalIncome.toLocaleString()}원</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="px-4 py-2 bg-danger-subtle border-b border-line-soft">
                                    <p className="text-caption font-medium text-danger">지출</p>
                                </div>
                                <div className="divide-y divide-line-soft">
                                    {expenseTotals.map((c) => (
                                        <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
                                            <p className="text-body text-fg">{c.name}</p>
                                            <p className="text-body font-medium text-danger">{c.total.toLocaleString()}원</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-surface">
                                        <p className="text-caption font-medium text-fg-muted">총 지출</p>
                                        <p className="text-body font-medium text-danger">{totalExpense.toLocaleString()}원</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 border-t border-line-soft bg-surface">
                            <p className="text-body font-medium text-fg">잔액</p>
                            <p className={`text-body font-medium ${totalIncome + totalExpense >= 0 ? "text-info" : "text-danger"}`}>
                                {(totalIncome + totalExpense).toLocaleString()}원
                            </p>
                        </div>
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
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-surface">
                                        <td className="px-4 py-2.5 text-fg whitespace-nowrap">{t.date.slice(0, 10)}</td>
                                        <td className="px-4 py-2.5 text-fg">{t.description}</td>
                                        <td className="px-4 py-2.5 text-fg-muted">{t.memo}</td>
                                        <td className={`px-4 py-2.5 text-right font-medium whitespace-nowrap ${t.amount < 0 ? "text-danger" : "text-info"}`}>
                                            {t.amount.toLocaleString()}원
                                        </td>
                                        <td className="px-4 py-2.5 text-caption text-fg-muted">{t.category || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

        </PageContainer>
    );
}
