import { useEffect, useMemo, useState } from "react";
import type { BookingService } from "./service-data";
import type { Slot } from "./BookingCalendar";

type BookingFormProps = {
  service: BookingService;
  slot?: Slot | null;
  onSubmit(data: BookingFormValues): void;
  isSubmitting?: boolean;
};

export type BookingFormValues = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
};

export default function BookingForm({ service, slot, onSubmit, isSubmitting }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    acceptTerms: false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [slot]);

  const isValid = useMemo(() => {
    return Boolean(
      slot &&
        formData.name.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(formData.email) &&
        formData.acceptTerms,
    );
  }, [slot, formData]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot) {
      setError("Please select a time slot.");
      return;
    }
    if (!isValid) {
      setError("Please complete all required fields.");
      return;
    }
    setError(null);

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      notes: formData.notes.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-[#D4AF37] uppercase">Step 2</p>
        <h3 className="text-2xl font-semibold text-ink">Your details</h3>
        <p className="text-sm text-gray-500">We'll send confirmations and reminders to this info.</p>
      </header>

      <div className="space-y-5">
        <div>
          <label className="form-label block text-sm font-medium text-gray-700 mb-2" htmlFor="booking-name">
            Full name
          </label>
          <input
            id="booking-name"
            name="name"
            type="text"
            className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="form-label block text-sm font-medium text-gray-700 mb-2" htmlFor="booking-email">
            Email address
          </label>
          <input
            id="booking-email"
            name="email"
            type="email"
            className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
            placeholder="you@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="form-label block text-sm font-medium text-gray-700 mb-2" htmlFor="booking-phone">
            Phone (optional)
          </label>
          <input
            id="booking-phone"
            name="phone"
            type="tel"
            className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
            placeholder="+44 7700 900123"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="form-label block text-sm font-medium text-gray-700 mb-2" htmlFor="booking-notes">
            Notes (optional)
          </label>
          <textarea
            id="booking-notes"
            name="notes"
            className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all resize-none"
            placeholder="Any context you'd like to share ahead of time?"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input
          id="accept-terms"
          name="acceptTerms"
          type="checkbox"
          className="mt-0.5 h-5 w-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
          checked={formData.acceptTerms}
          onChange={handleChange}
        />
        <label htmlFor="accept-terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
          I understand and agree to the booking policies and consent to receiving emails about my session.
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="w-full rounded-full bg-black px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
      >
        {isSubmitting ? "Processing..." : service.price === 0 ? "Confirm Booking" : "Continue to Payment"}
      </button>
    </form>
  );
}
