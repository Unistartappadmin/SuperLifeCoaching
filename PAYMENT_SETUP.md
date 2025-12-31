# Stripe Payment Integration Setup Guide

## Overview
This guide explains how to set up and test the Stripe payment integration for the SuperLife Coaching booking system.

## Features Implemented

### 1. Payment Intent Creation
- **Supabase Edge Function**: `create-payment-intent`
- Hosted at `${PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`
- Creates Stripe Payment Intents before booking
- Handles free services (skips payment)
- Validates service pricing

### 2. Frontend Payment Flow
- Integrated Stripe Payment Element in booking flow
- 4-step process for paid services:
  1. Select time slot
  2. Enter contact details
  3. Complete payment (Stripe Payment Element)
  4. Confirmation page
- 3-step process for free services (skips payment)

### 3. Payment Verification
- Backend verifies payment before creating booking
- Validates payment amount matches service price
- Confirms payment status is "succeeded"

### 4. Webhook Handler
- **Supabase Edge Function**: `stripe-webhook`
- Hosted at `${PUBLIC_SUPABASE_URL}/functions/v1/stripe-webhook`
- Handles `payment_intent.succeeded` events
- Updates booking status to confirmed
- Sends payment receipt emails automatically

### 5. Email Notifications
- Enhanced confirmation emails with payment info
- Dedicated payment receipt emails with:
  - Payment amount and currency
  - Payment Intent ID
  - Stripe receipt URL link
  - Session details

## Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase + Stripe
PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"  # Required for Edge Functions
PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"               # Frontend (starts with pk_)
STRIPE_SECRET_KEY="sk_test_xxx"                           # Backend (starts with sk_)
STRIPE_WEBHOOK_SECRET="whsec_xxx"                         # Webhook signing secret
```

## Supabase Edge Functions

Stripe payment intents live entirely inside the Supabase Edge Function (`create-payment-intent`). The booking UI calls `${PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent` directly; if `PUBLIC_SUPABASE_URL` is missing the payment step will surface an error so you know to configure it. To work locally or deploy:

```bash
# Serve locally with your env vars
cd supabase
supabase functions serve create-payment-intent --env-file ../.env.local

# Deploy to Supabase
supabase functions deploy create-payment-intent

# Make sure the Stripe secret is available to the function
supabase secrets set --env-file ../.env.local STRIPE_SECRET_KEY
```

> The function requires `STRIPE_SECRET_KEY` and the frontend needs `PUBLIC_SUPABASE_URL` to reach it.

### Stripe Webhook Function

The webhook endpoint runs as the Supabase Edge Function (`stripe-webhook`). Point Stripe (or the Stripe CLI) at `https://<YOUR_PROJECT>.functions.supabase.co/stripe-webhook`.

```bash
# Serve locally, forwarding Stripe CLI traffic to localhost:<port>
cd supabase
supabase functions serve stripe-webhook --env-file ../.env.local --port 54322

# Deploy the webhook
supabase functions deploy stripe-webhook

# Provide the secrets required by the function
supabase secrets set --env-file ../.env.local STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET RESEND_API_KEY RESEND_FROM_EMAIL SUPABASE_SERVICE_ROLE_KEY
```

> Locally, run `stripe listen --forward-to http://localhost:54322/stripe-webhook` to test the function before deploying.

## Getting Stripe Keys

### 1. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Verify your email
3. Complete business information

### 2. Get API Keys
1. Go to **Developers** → **API keys**
2. Copy **Publishable key** → Set as `PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Reveal and copy **Secret key** → Set as `STRIPE_SECRET_KEY`

**Important**: Use **test mode** keys for development (they start with `pk_test_` and `sk_test_`)

### 3. Set Up Webhook (for production)
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://<YOUR_PROJECT>.functions.supabase.co/stripe-webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** → Set as `STRIPE_WEBHOOK_SECRET`

## Testing Payment Flow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Booking Page
```
http://localhost:4322/booking?service=clarifying-session
```

### 3. Test Cards (Stripe Test Mode)

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Exp: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment:**
- Card: `4000 0000 0000 0002`
- Exp: Any future date
- CVC: Any 3 digits

**Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`
- Exp: Any future date
- CVC: Any 3 digits

More test cards: https://stripe.com/docs/testing

### 4. Expected Flow

1. **Select a time slot** → Click "Continue to Details"
2. **Enter your contact info** → Click "Continue"
3. **Payment page appears** (only for paid services)
   - Enter test card details
   - Click "Pay $XX"
4. **Confirmation page** shows:
   - Payment successful message
   - Booking details
   - Email confirmation notice

### 5. Check Results

**In Stripe Dashboard:**
1. Go to **Payments** in test mode
2. You should see the payment with status "Succeeded"
3. Click on it to see payment details and metadata

**In Your Email:**
1. Confirmation email with payment info
2. Separate payment receipt email (if booking created successfully)

**In Database (Supabase):**
1. Check `bookings` table
2. New row with:
   - `status: "confirmed"`
   - `payment_status: "paid"`
   - `stripe_payment_intent_id: "pi_xxx"`

## Testing Webhooks Locally

To test webhooks on your local machine:

### 1. Install Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:54322/stripe-webhook
```

This will give you a webhook signing secret (starts with `whsec_`). Add it to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_xxx"
```

### 4. Trigger Test Events
In another terminal:
```bash
stripe trigger payment_intent.succeeded
```

## Architecture

### Payment Flow Diagram
```
User selects service → Booking form → Payment (if paid) → Confirmation
     ↓                      ↓                ↓                  ↓
  Calendar API      Supabase fn:     Stripe Payment    /api/booking/create
                 create-payment-        Element         (with paymentIntentId)
                      intent
                                           ↓
                                   Stripe processes
                                      payment
                                           ↓
                                   Webhook notifies
                             Supabase fn: stripe-webhook
                                           ↓
                                   Update booking status
                                   Send receipt email
```

### Key Files

**Frontend:**
- `src/components/booking/BookingFlow.tsx` - Main booking orchestration
- `src/components/booking/PaymentStep.tsx` - Payment UI with Stripe Element
- `src/components/booking/ProgressSteps.tsx` - Step indicator (4 steps for paid)
- `src/lib/stripe-client.ts` - Stripe.js initialization

**Backend & Functions:**
- `supabase/functions/create-payment-intent/index.ts` - Creates Payment Intent
- `supabase/functions/stripe-webhook/index.ts` - Handles Stripe webhooks
- `src/pages/api/booking/create.ts` - Creates booking after payment
- `src/lib/email.ts` - Email templates with payment receipts

**Configuration:**
- `src/components/booking/service-data.ts` - Service pricing

## Currency Configuration

Currently set to **USD**. To change:

1. Update the `currency` constant in `supabase/functions/create-payment-intent/index.ts`:
```typescript
const currency = "usd"; // Change to 'gbp', 'eur', etc.
```

2. Update display in email templates in `src/lib/email.ts`

## Security Considerations

✅ **Implemented:**
- Payment verification before booking creation
- Amount validation (prevents tampering)
- Webhook signature verification
- Server-side payment processing only
- Test mode keys for development

⚠️ **Before Production:**
- Switch to **live mode** Stripe keys
- Set up production webhook endpoint
- Enable HTTPS for webhook endpoint
- Review Stripe Dashboard security settings
- Test with real cards (small amounts)

## Troubleshooting

### Payment Element not showing
- Check `PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- Make sure key starts with `pk_test_` in test mode
- Check browser console for errors

### Webhook not receiving events
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check Stripe CLI is forwarding correctly
- Review webhook endpoint logs in Stripe Dashboard

### Booking created but status still "pending"
- Check webhook is properly configured
- Verify webhook secret matches
- Look at webhook delivery logs in Stripe Dashboard

### TypeScript errors
- Make sure `stripe` package version matches API version
- Current API version: `2025-11-17.clover`

## Next Steps

1. **Test thoroughly** with all service types
2. **Set up production webhook** when deploying
3. **Switch to live mode** keys for production
4. **Test with real cards** (small amounts first)
5. **Monitor Stripe Dashboard** for issues
6. **Set up Stripe alerts** for failed payments

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe Webhooks: https://stripe.com/docs/webhooks

---

**Payment integration is complete and ready for testing!** 🎉
