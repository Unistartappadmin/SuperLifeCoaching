# Supabase Environment Variables Setup

## Required Environment Variables for Edge Functions

You need to set these environment variables in your Supabase project dashboard.

### How to Set Them:
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Add the following environment variables

---

## 📧 Email Configuration (Resend)

### `RESEND_API_KEY` ✅ **REQUIRED**
Your Resend API key for sending emails.

**How to get it:**
1. Go to https://resend.com
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `re_`)

**Example:** `re_AbCdEfGh123456789`

---

### `RESEND_FROM_EMAIL` ⚠️ Optional (but recommended)
The "from" email address for all outgoing emails.

**Default if not set:** `SuperLife Coaching <noreply@superlifecoaching.com>`

**Important:**
- You must verify this domain/email in Resend first!
- Go to Resend dashboard → Domains → Add domain
- Follow their DNS verification steps

**Example:** `SuperLife Coaching <booking@yourdomain.com>`

---

### `BOOKING_ADMIN_EMAIL` ⚠️ Optional
Email address where admin notifications are sent when new bookings are created.

**Default if not set:** `hello@superlifecoaching.com`

**Example:** `radu@yourdomain.com`

---

## 💳 Stripe Configuration

### `STRIPE_SECRET_KEY` ✅ **REQUIRED**
Your Stripe secret key for processing payments.

**How to get it:**
1. Go to https://dashboard.stripe.com
2. Navigate to **Developers** → **API keys**
3. Copy the **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

**Example:** `sk_test_51AbCdEfGh...`

---

### `STRIPE_WEBHOOK_SECRET` ✅ **REQUIRED**
Webhook signing secret for verifying Stripe webhook events.

**How to get it:**
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** (starts with `whsec_`)

**Example:** `whsec_AbCdEfGh123456789`

---

## 🗄️ Supabase Configuration

### `SUPABASE_URL` ✅ **REQUIRED**
Your Supabase project URL.

**How to get it:**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **API**
3. Copy the **URL** field

**Example:** `https://abcdefghijklmnop.supabase.co`

---

### `SUPABASE_SERVICE_ROLE_KEY` ✅ **REQUIRED**
Service role key for server-side operations (bypasses Row Level Security).

**How to get it:**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **API**
3. Copy the **service_role** key (NOT the anon key!)
4. ⚠️ **WARNING:** Keep this secret! Never expose it in frontend code.

**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 📋 Summary Checklist

Before deploying, make sure you have set:

- [ ] `RESEND_API_KEY` - From Resend dashboard
- [ ] `RESEND_FROM_EMAIL` - Your verified sending domain (optional)
- [ ] `BOOKING_ADMIN_EMAIL` - Where to receive admin notifications (optional)
- [ ] `STRIPE_SECRET_KEY` - From Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe webhook settings
- [ ] `SUPABASE_URL` - From Supabase project settings
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase project settings

---

## 🚀 Deploy Commands

After setting all environment variables, deploy the edge functions:

```bash
# Deploy both edge functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
```

---

## ✅ Emails That Will Be Sent

### For Paid Bookings:
1. **After successful payment (via webhook):**
   - ✉️ Payment receipt to customer
   - ✉️ Booking confirmation to customer
   - ✉️ Admin notification to admin email

### For Free Bookings:
1. **Immediately after booking creation:**
   - ✉️ Booking confirmation to customer
   - ✉️ Admin notification to admin email

---

## 🧪 Testing Email Setup

1. Set all environment variables in Supabase
2. Deploy the edge functions
3. Make a test booking
4. Check your email inbox
5. Check Resend dashboard for email logs

If emails aren't arriving:
- Verify `RESEND_API_KEY` is correct
- Check that `RESEND_FROM_EMAIL` domain is verified in Resend
- Check Resend dashboard logs for errors
- Check Supabase edge function logs for errors
