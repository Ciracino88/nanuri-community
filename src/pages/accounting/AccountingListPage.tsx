import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import PageContainer from "../../components/PageContainer";
import { supabase } from "../../lib/supabase";
import { fetchList } from "../../lib/supabaseList";
import LoadingScreen from "../../components/LoadingScreen";

interface Report {
    id: string;
    period: string;
    total_income: number;
    total_expense: number;
    created_at: string;
}

export default function AccountingListPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: reports = [], isLoading } = useQuery({
        queryKey: ["accounting_reports"],
        queryFn: () => fetchList<Report>("accounting_reports"),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("accounting_reports").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounting_reports"] });
        },
        onError: () => {
            toast.error("삭제에 실패했어요");
        },
    });

    const handleDelete = (id: string) => {
        if (!confirm("이 장부를 삭제할까요?")) return;
        deleteMutation.mutate(id);
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <PageContainer width="wide">

                <div className="relative bg-info-subtle rounded-2xl p-5 overflow-hidden">
                    <i className="ti ti-currency-won absolute text-info" style={{ right: 8, bottom: -6, fontSize: 76, opacity: 0.14 }} aria-hidden="true" />
                    <h1 className="text-title font-medium text-info-strong">회계 장부</h1>
                    <p className="text-body text-info mt-1.5">월별 지출 내역을 관리하세요</p>
                </div>

                <button
                    onClick={() => navigate("/accounting/new")}
                    className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl border border-line bg-card text-body text-info font-medium hover:bg-surface transition"
                >
                    <i className="ti ti-plus text-emphasis" aria-hidden="true" />
                    장부 추가
                </button>

                {reports.length === 0 ? (
                    <div className="bg-card border border-line-soft rounded-xl p-8 text-center text-body text-fg-faint">
                        저장된 장부가 없습니다
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {reports.map((r) => (
                            <div key={r.id} className="bg-card border border-line-soft rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-line transition">
                                <button onClick={() => navigate(`/accounting/${r.id}`)} className="flex-1 text-left flex flex-col gap-1">
                                    <p className="text-body font-medium text-fg-strong">{r.period}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-caption text-info">+{r.total_income.toLocaleString()}원</span>
                                        <span className="text-caption text-danger">{r.total_expense.toLocaleString()}원</span>
                                        <span className="text-caption text-fg-faint">
                                            잔액 {(r.total_income + r.total_expense).toLocaleString()}원
                                        </span>
                                    </div>
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        disabled={deleteMutation.isPending}
                                        className="text-fg-faint hover:text-danger transition p-1 disabled:opacity-40"
                                    >
                                        <i className="ti ti-trash text-emphasis" aria-hidden="true" />
                                    </button>
                                    <i className="ti ti-chevron-right text-fg-faint text-heading" aria-hidden="true" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

        </PageContainer>
    );
}
