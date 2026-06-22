import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../lib/supabase";
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
    const { userProfile, signOut } = useAuthStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.from("accounting_reports").select("*").order("created_at", { ascending: false })
            .then(({ data }) => { setReports(data ?? []); setLoading(false); });
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("이 장부를 삭제할까요?")) return;
        await supabase.from("accounting_reports").delete().eq("id", id);
        setReports((prev) => prev.filter((r) => r.id !== id));
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar
                userName={userProfile?.name}
                onLogout={async () => { await signOut(); navigate("/"); }}
                onProfileEdit={() => navigate("/member/setup")}
            />
            <div className="max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-5">

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 mb-0.5">나누리 청년부</p>
                        <h1 className="text-xl font-medium text-gray-800">회계 장부</h1>
                    </div>
                    <button
                        onClick={() => navigate("/accounting/new")}
                        className="flex items-center gap-1.5 text-sm text-blue-500 font-medium"
                    >
                        <i className="ti ti-plus text-base" aria-hidden="true" />
                        장부 추가
                    </button>
                </div>

                {reports.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-300">
                        저장된 장부가 없습니다
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {reports.map((r) => (
                            <div key={r.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center justify-between hover:border-gray-200 transition">
                                <button onClick={() => navigate(`/accounting/${r.id}`)} className="flex-1 text-left flex flex-col gap-1">
                                    <p className="text-sm font-medium text-gray-800">{r.period}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-blue-400">+{r.total_income.toLocaleString()}원</span>
                                        <span className="text-xs text-red-400">{r.total_expense.toLocaleString()}원</span>
                                        <span className="text-xs text-gray-400">
                                            잔액 {(r.total_income + r.total_expense).toLocaleString()}원
                                        </span>
                                    </div>
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="text-gray-300 hover:text-red-400 transition p-1"
                                    >
                                        <i className="ti ti-trash text-base" aria-hidden="true" />
                                    </button>
                                    <i className="ti ti-chevron-right text-gray-300 text-lg" aria-hidden="true" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
