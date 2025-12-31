import type { BookingService } from "./service-data";
import type { Slot } from "./BookingCalendar";

type BookingSummaryProps = {
  service: BookingService;
  slot?: Slot | null;
};

const formatPrice = (value: number) =>
  value === 0 ? "Free" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

export default function BookingSummary({ service, slot }: BookingSummaryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-6 min-w-0">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-[#D4AF37] uppercase">
          Booking Summary
        </p>
        <h3 className="text-xl font-semibold text-ink">
          {service.name}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {service.description}
        </p>
      </header>

      <div className="space-y-4">
        {/* Service Details */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-700">Session Duration</p>
              <p className="text-lg font-semibold text-ink">{service.duration} minutes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Investment</p>
              <p className="text-2xl font-bold text-ink">{formatPrice(service.price)}</p>
            </div>
          </div>
          
          {service.sessions && service.sessions > 1 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Package includes <span className="font-semibold">{service.sessions} sessions</span>
                {service.sessions > 1 && (
                  <span className="block mt-1 text-gray-500">
                    Additional sessions scheduled after your first meeting
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Selected Time */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Selected Time</p>
          {slot ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-ink">
                {new Date(slot.start).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </p>
              <p className="text-base font-medium text-gray-800">
                {slot.label}
              </p>
              <p className="text-xs text-gray-500">
                UK Time • {service.duration} minutes
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Please select your preferred date and time
            </p>
          )}
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-gray-600">Email confirmation included</p>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-600">Secure online session</p>
            </div>
            {service.price === 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-600">No payment required</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
