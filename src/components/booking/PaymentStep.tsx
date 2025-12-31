import React, { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "../../lib/stripe-client";
import { supabaseEnv } from "../../lib/supabase";
import type { BookingService } from "./service-data";

const PAYMENT_INTENT_ENDPOINT = `${supabaseEnv.url}/functions/v1/create-payment-intent`;

type Slot = {
  start: string;
  end: string;
  label: string;
  timezone: string;
};

type PaymentStepProps = {
  service: BookingService;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  slot: Slot;
  onPaymentSuccess: (paymentIntentId: string, bookingId: string) => void;
  onBack: () => void;
};

type PaymentFormProps = PaymentStepProps & {
  bookingId: string;
};

function PaymentForm({
  service,
  customerName,
  customerEmail,
  bookingId,
  onPaymentSuccess,
  onBack,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation`,
          receipt_email: customerEmail,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id, bookingId);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-600">
              {service.sessions ? `${service.sessions} sessions` : `${service.duration} minutes`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">£{service.price}</p>
            <p className="text-xs text-gray-500">GBP</p>
          </div>
        </div>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Pay £${service.price}`}
        </button>
      </div>

      <p className="text-xs text-center text-gray-500">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}

export default function PaymentStep(props: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(PAYMENT_INTENT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseEnv.anonKey,
            'Authorization': `Bearer ${supabaseEnv.anonKey}`,
          },
          body: JSON.stringify({
            serviceSlug: props.service.slug,
            customerEmail: props.customerEmail,
            customerName: props.customerName,
            customerPhone: props.customerPhone,
            notes: props.notes,
            slot: props.slot,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent');
        }

        if (data.requiresPayment === false) {
          // Free service - skip payment
          props.onPaymentSuccess('free', data.bookingId);
          return;
        }

        setClientSecret(data.clientSecret);
        setBookingId(data.bookingId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [props.service.slug, props.customerEmail, props.customerName, props.customerPhone, props.notes, props.slot]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Setting up secure payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium mb-2">Payment Setup Failed</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
        <button
          onClick={props.onBack}
          className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!clientSecret || !bookingId) {
    return null;
  }

  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#dc2626',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentForm {...props} bookingId={bookingId} />
    </Elements>
  );
}
