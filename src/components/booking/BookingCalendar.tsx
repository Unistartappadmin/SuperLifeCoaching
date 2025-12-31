import { useEffect, useMemo, useRef, useState } from "react";

export type Slot = {
  start: string;
  end: string;
  label: string;
  timezone: string;
};

type BookingCalendarProps = {
  serviceName: string;
  duration: number;
  onSlotSelect(slot: Slot | null): void;
  selectedSlot?: Slot | null;
};

const MIN_ADVANCE_HOURS = 24;
const MAX_ADVANCE_DAYS = 90;
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function BookingCalendar({ serviceName, duration, onSlotSelect, selectedSlot }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(() => startOfToday());
  const [viewDate, setViewDate] = useState(() => startOfToday());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slotsContainerRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);

  const today = useMemo(() => startOfToday(), []);
  const calendarStart = useMemo(() => startOfWeek(viewDate), [viewDate]);
  const calendarDates = useMemo(() => Array.from({ length: 35 }, (_, index) => addDays(calendarStart, index)), [calendarStart]);
  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const viewEnd = addDays(calendarStart, 34);
  const maxAdvanceDate = addDays(today, MAX_ADVANCE_DAYS);

  useEffect(() => {
    async function fetchSlots() {
      setIsLoading(true);
      setError(null);
      onSlotSelect(null);
      try {
        const response = await fetch(`/api/calendar/availability?date=${formatDateKey(selectedDate)}&duration=${duration}`);
        if (!response.ok) throw new Error("Unable to load available slots.");
        const data = await response.json();
        setSlots(data.slots ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load availability. Please try another date.");
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, duration, onSlotSelect]);

  useEffect(() => {
    if (selectedDate < calendarStart || selectedDate > viewEnd) {
      setViewDate(selectedDate);
    }
  }, [selectedDate, calendarStart, viewEnd]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 640) return;
    if (!slots.length) return;
    if (hasAutoScrolledRef.current) return;

    const el = slotsContainerRef.current;
    if (el) {
      hasAutoScrolledRef.current = true;
      setTimeout(() => {
        el.scrollTo({ left: el.scrollWidth * 0.2, behavior: "smooth" });
      }, 400);
    }
  }, [slots]);

  const isDateSelectable = (date: Date) => {
    const diffMs = date.getTime() - today.getTime();
    const diffHours = diffMs / 1000 / 3600;
    return diffHours >= MIN_ADVANCE_HOURS && diffHours <= MAX_ADVANCE_DAYS * 24;
  };

  const goToPrev = () => {
    const prev = new Date(calendarStart);
    prev.setUTCDate(prev.getUTCDate() - 28);
    setViewDate(prev);
  };

  const goToNext = () => {
    const next = new Date(calendarStart);
    next.setUTCDate(next.getUTCDate() + 28);
    setViewDate(next);
  };

  const canGoPrev = calendarStart > startOfWeek(today);
  const canGoNext = viewEnd < maxAdvanceDate;

  return (
    <div className="space-y-8 min-w-0 -mx-4 sm:mx-0">
      <header className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">Step 1</p>
        <h3 className="text-[1.5rem] font-semibold text-ink leading-tight">Book your {serviceName}</h3>
        <p className="text-xs text-gray-500">All times shown in {slots[0]?.timezone ?? "local timezone"}.</p>
      </header>

      <div className="rounded-none border border-gray-200 border-l-0 border-r-0 sm:rounded-[26px] sm:border-l sm:border-r bg-white p-4 sm:p-5 shadow-sm space-y-5 overflow-x-hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrev}
            disabled={!canGoPrev}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 transition hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">{monthLabel}</p>
          <button
            type="button"
            onClick={goToNext}
            disabled={!canGoNext}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 transition hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[0.6rem] sm:text-[0.65rem] font-semibold tracking-[0.2em] text-gray-400">
          {WEEKDAYS.map((day) => (
            <span key={day} className="hidden sm:inline">{day}</span>
          ))}
          {WEEKDAYS.map((day) => (
            <span key={`mobile-${day}`} className="sm:hidden">{day.slice(0, 1)}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDates.map((date) => {
            const key = formatDateKey(date);
            const isSelected = key === formatDateKey(selectedDate);
            const selectable = isDateSelectable(date);
            const isToday = key === formatDateKey(today);
            return (
              <button
                key={key}
                type="button"
                disabled={!selectable}
                onClick={() => setSelectedDate(date)}
                className={`flex h-10 sm:h-12 flex-col items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                  isSelected
                    ? "border-black bg-black text-white shadow-lg"
                    : "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                } ${!selectable ? "opacity-20 cursor-not-allowed" : ""}`}
              >
                <span className="text-sm sm:text-base">{date.getUTCDate()}</span>
                {isToday && <span className="text-[8px] sm:text-[9px] uppercase text-[#D4AF37] tracking-[0.2em]">Today</span>}
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Step 1b</p>
              <h4 className="text-base font-semibold text-ink">Select a time</h4>
            </div>
            <span className="uppercase tracking-[0.3em] text-gray-400">{slots[0]?.timezone ?? "Local"}</span>
          </div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-black"></div>
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500">{error}</p>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 py-6 text-center text-sm text-gray-500">
              No slots available for this date.<br />Please choose another.
            </div>
          ) : (
            <div
              ref={slotsContainerRef}
              id="slot-scroll"
              className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 snap-x snap-mandatory px-2 sm:px-0"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#d1d5db transparent" }}
            >
              {slots.map((slot) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => onSlotSelect(slot)}
                    className={`min-w-[120px] flex-shrink-0 snap-start rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition-all ${
                      isSelected
                        ? "border-black bg-black text-white shadow-lg"
                        : "border-gray-200 text-gray-700 hover:border-black hover:text-black"
                    }`}
                  >
                    <span className="block text-base">{slot.label}</span>
                    <span className="text-[10px] text-gray-400 uppercase">{duration} mins</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        #slot-scroll::-webkit-scrollbar {
          height: 6px;
        }
        #slot-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 9999px;
        }
        #slot-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}

function startOfToday() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

function startOfWeek(date: Date) {
  const base = new Date(date);
  const day = base.getUTCDay() === 0 ? 7 : base.getUTCDay();
  base.setUTCDate(base.getUTCDate() - (day - 1));
  base.setUTCHours(0, 0, 0, 0);
  return base;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0] ?? "";
}
