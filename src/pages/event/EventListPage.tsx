import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useEventList } from "../../hooks/useEvents";
import { formatEventDate } from "../../lib/eventTime";

export default function EventListPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventList();

  return (
    <PageContainer width="default">

      <div className="relative bg-purple-subtle rounded-2xl p-5 overflow-hidden">
        <i className="ti ti-calendar-event absolute text-purple" style={{ right: 8, bottom: -6, fontSize: 76, opacity: 0.14 }} aria-hidden="true" />
        <h1 className="text-title font-medium text-purple-strong">행사</h1>
        <p className="text-body text-purple mt-1.5">일정을 보고 순서마다 평가해요</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <div className="bg-card border border-line-soft rounded-xl p-6 text-center text-body text-fg-faint">
          예정된 행사가 없어요
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => navigate(`/event/${ev.id}`)}
              className="bg-card border border-line-soft rounded-2xl p-4 flex items-center gap-3 text-left hover:border-line active:scale-[0.99] transition"
            >
              {ev.image_url ? (
                <img src={ev.image_url} alt="" className="w-14 h-14 rounded-xl object-cover border border-line-soft shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-purple-subtle flex items-center justify-center shrink-0">
                  <i className="ti ti-calendar-event text-purple text-heading" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium text-fg-strong truncate">{ev.title}</p>
                <p className="text-caption text-fg-faint mt-0.5 truncate">
                  {formatEventDate(ev.event_date, { month: "long", day: "numeric", weekday: "short" })}
                  {ev.start_time && ` · ${ev.start_time.slice(0, 5)}`}
                  {ev.place_name && ` · ${ev.place_name}`}
                </p>
              </div>
              <i className="ti ti-chevron-right text-fg-faint text-emphasis shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

    </PageContainer>
  );
}
