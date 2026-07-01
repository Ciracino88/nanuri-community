import { useNavigate } from "react-router-dom";
import { CalendarIcon } from "@heroicons/react/outline";
import PageContainer from "../../components/PageContainer";
import PageHero from "../../components/PageHero";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useEventList } from "../../hooks/useEvents";
import { formatEventDate } from "../../lib/eventTime";
import { TAB_COLORS } from "../../constants/theme";

export default function EventListPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEventList();

  return (
    <PageContainer width="default">

      <PageHero Icon={CalendarIcon} title="행사" desc={"일정을 확인하고\n의견을 남겨보세요"} tint="purple" />

      {isLoading ? (
        <LoadingSpinner color={TAB_COLORS.events} />
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
