import { useCallback, useMemo, useState } from "react";
import BookingCalendar, { type Slot } from "./BookingCalendar";
import BookingForm, { type BookingFormValues } from "./BookingForm";
import BookingSummary from "./BookingSummary";
import ProgressSteps from "./ProgressSteps";
import PaymentStep from "./PaymentStep";
import type { BookingService } from "./service-data";

type BookingFlowProps = {
  service: BookingService;
};

type BookingResponse = {
  bookingId: string;
  requiresPayment: boolean;
  paymentClientSecret?: string;
};

type BookingFormData = BookingFormValues | null;

export default function BookingFlow({ service }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [formData, setFormData] = useState<BookingFormData>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const isPaidService = service.price > 0;

  const handleSlotSelect = useCallback((slot: Slot | null) => {
    setSelectedSlot(slot);
  }, []);

  const handleContinue = () => {
    if (selectedSlot) {
      setCurrentStep(2);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBookingSubmit = async (values: BookingFormValues) => {
    if (!selectedSlot) {
      setSubmissionError("Please select a time slot.");
      return;
    }

    setFormData(values);
    setSubmissionError(null);

    // For paid services, go to payment step
    if (isPaidService) {
      setCurrentStep(3);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // For free services, create booking immediately
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          serviceSlug: service.slug,
          slot: selectedSlot,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create booking.");
      }

      const data = (await response.json()) as BookingResponse;
      setBookingResponse(data);
      setCurrentStep(4);
    } catch (error) {
      console.error(error);
      setSubmissionError("Unable to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (intentId: string, bookingId: string) => {
    // Booking already created during payment intent creation
    // Just show confirmation
    setPaymentIntentId(intentId);
    setBookingResponse({
      bookingId,
      requiresPayment: intentId !== 'free',
    });
    setCurrentStep(4);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const stepOneDisabled = !selectedSlot;
  const summarySlot = useMemo(() => selectedSlot, [selectedSlot]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <ProgressSteps currentStep={currentStep} isPaidService={isPaidService} />

        {currentStep === 1 && (
          <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="rounded-3xl bg-white p-6 shadow-sm min-w-0">
              <BookingCalendar serviceName={service.name} duration={service.duration} selectedSlot={selectedSlot} onSlotSelect={handleSlotSelect} />
              <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={stepOneDisabled}
                  className={`rounded-full px-8 py-3 text-sm font-semibold transition-all ${
                    stepOneDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-black text-white shadow-lg hover:-translate-y-0.5 hover:bg-gray-900"
                  }`}
                >
                  Continue to Details
                </button>
              </div>
            </div>

            <aside className="hidden lg:block lg:sticky lg:self-start lg:top-24">
              <BookingSummary service={service} slot={summarySlot} />
            </aside>

            {/* Mobile summary - shown at bottom on mobile */}
            <div className="lg:hidden">
              <BookingSummary service={service} slot={summarySlot} />
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] lg:items-start">
            <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm min-w-0">
              <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-black">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change date & time
              </button>

              <header className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">2</div>
                  <h2 className="text-2xl font-semibold text-ink">Your details</h2>
                </div>
                <p className="ml-11 text-gray-500">Please provide your contact information</p>
              </header>

              <div className="ml-11">
                <BookingForm service={service} slot={selectedSlot} onSubmit={handleBookingSubmit} isSubmitting={isSubmitting} />
              </div>

              {submissionError && <div className="ml-11 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{submissionError}</div>}
            </div>

            <aside className="hidden lg:block lg:sticky lg:self-start lg:top-24">
              <BookingSummary service={service} slot={summarySlot} />
            </aside>

            {/* Mobile summary - shown at bottom on mobile */}
            <div className="lg:hidden">
              <BookingSummary service={service} slot={summarySlot} />
            </div>
          </section>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && formData && (
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] lg:items-start">
            <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
              <button type="button" onClick={() => setCurrentStep(2)} className="inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-black">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to details
              </button>

              <header className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">3</div>
                  <h2 className="text-2xl font-semibold text-ink">Payment</h2>
                </div>
                <p className="ml-11 text-gray-500">Secure payment to confirm your booking</p>
              </header>

              <div className="ml-11">
                <PaymentStep
                  service={service}
                  customerName={formData.name}
                  customerEmail={formData.email}
                  customerPhone={formData.phone}
                  notes={formData.notes}
                  slot={selectedSlot!}
                  onPaymentSuccess={handlePaymentSuccess}
                  onBack={() => setCurrentStep(2)}
                />
              </div>

              {submissionError && <div className="ml-11 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{submissionError}</div>}
            </div>

            <aside className="hidden lg:block lg:sticky lg:self-start lg:top-24">
              <BookingSummary service={service} slot={summarySlot} />
            </aside>
          </section>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && bookingResponse && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center space-y-8">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Header */}
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-ink">
                  {paymentIntentId && paymentIntentId !== 'free' ? 'Payment Successful!' : 'Booking Confirmed!'}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {paymentIntentId && paymentIntentId !== 'free'
                    ? "Your payment has been processed and your session is confirmed. You'll receive a receipt and booking details via email shortly."
                    : "Your session is confirmed. You'll receive confirmation details via email shortly."}
                </p>
              </div>

              {/* Payment Success Details */}
              {paymentIntentId && paymentIntentId !== 'free' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-left max-w-xl mx-auto">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-semibold text-green-800 mb-1">Payment Confirmed</p>
                      <p className="text-sm text-green-700">
                        £{service.price} has been charged to your card. A receipt has been sent to your email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="/services"
                  className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Book Another Session
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-8 py-3 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-900 transition-colors"
                >
                  Return Home
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
