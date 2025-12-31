# SuperLife Coaching Email Templates

Ultra-premium email templates with consistent branding for SuperLife Coaching.

## 📧 Available Templates

### 1. **Booking Confirmation Email**
Sent to clients when they successfully book a coaching session or package.

**Features:**
- Professional booking confirmation with all session details
- Special handling for single sessions vs. packages
- Payment confirmation status
- Next steps and preparation guidance
- Clear call-to-action buttons

**Usage:**
```typescript
import { generateBookingConfirmationEmail } from "@/lib/email-templates";

const html = generateBookingConfirmationEmail({
  clientName: "John Smith",
  clientEmail: "john@example.com",
  serviceName: "Executive Life Coaching",
  sessionDate: "2024-02-15T10:00:00Z",
  sessionTime: "10:00 AM GMT",
  sessionDuration: "60 minutes",
  packageSessions: 1, // or 6 for packages
  price: 150,
  bookingReference: "SLC-2024-001",
  notes: "Optional special notes",
});
```

### 2. **Admin Booking Notification**
Sent to admin when a new booking is received.

**Features:**
- Complete client and booking information
- Payment status indicator
- Quick action links to admin dashboard
- Timestamped for tracking
- Professional formatting for admin review

**Usage:**
```typescript
import { generateAdminBookingNotification } from "@/lib/email-templates";

const html = generateAdminBookingNotification({
  clientName: "John Smith",
  clientEmail: "john@example.com",
  clientPhone: "+44 7700 900123",
  serviceName: "Executive Life Coaching",
  sessionDate: "2024-02-15T10:00:00Z",
  sessionTime: "10:00 AM GMT",
  sessionDuration: "60 minutes",
  packageSessions: 1,
  price: 150,
  paymentStatus: "paid", // or "pending"
  bookingReference: "SLC-2024-001",
  bookingId: "booking_123456",
  notes: "Client notes here",
});
```

### 3. **Contact Form Auto-Reply**
Automatic response sent to users who submit the contact form.

**Features:**
- Friendly acknowledgment of their inquiry
- Sets expectations for response time
- Links to explore services
- Contact information for urgent matters

**Usage:**
```typescript
import { generateContactAutoReply } from "@/lib/email-templates";

const html = generateContactAutoReply({
  name: "Sarah Johnson",
  email: "sarah@example.com",
  subject: "Interested in Coaching",
  message: "I'd like to learn more about your services...",
});
```

### 4. **Contact Form Admin Notification**
Sent to admin when someone submits the contact form.

**Features:**
- Complete contact information
- Full message content
- Quick reply button
- Response time reminder
- Conversion tips

**Usage:**
```typescript
import { generateContactAdminNotification } from "@/lib/email-templates";

const html = generateContactAdminNotification({
  name: "Sarah Johnson",
  email: "sarah@example.com",
  phone: "+44 7700 900456",
  subject: "Interested in Coaching",
  message: "I'd like to learn more about your services...",
  submittedAt: new Date(),
});
```

## 🎨 Design Features

### Premium Branding
- **Colors:** Black (#0A0A0A), White (#FFFFFF), Gold (#D4AF37)
- **Typography:** System fonts for maximum email client compatibility
- **Layout:** Clean, responsive design optimized for all devices

### Email Client Compatibility
- Inline CSS for maximum compatibility
- Tested on major email clients (Gmail, Outlook, Apple Mail)
- Responsive design for mobile devices
- Fallbacks for older email clients

### Professional Elements
- SuperLife® branding throughout
- Gradient gold buttons for CTAs
- Clean info boxes for structured data
- Elegant dividers and spacing
- Premium footer with links

## 🧪 Testing Templates

### Generate HTML Previews
Create HTML files you can open in a browser to preview the emails:

```bash
npm run test:emails
```

This will create an `email-previews/` folder with HTML files for all templates.

### Send Test Emails
Send actual test emails using Resend:

```bash
npm run test:emails -- --send
```

**Requirements:**
- `RESEND_API_KEY` in your `.env` file
- `RESEND_FROM_EMAIL` configured
- `BOOKING_ADMIN_EMAIL` configured
- Optional: `TEST_EMAIL` for custom test recipient

### Environment Variables
```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=SuperLife Coaching <noreply@superlifecoaching.uk>
BOOKING_ADMIN_EMAIL=hello@superlifecoaching.uk
TEST_EMAIL=your-test@email.com  # Optional
```

## 📝 Customization

### Base Template
All templates use `base-template.ts` for consistent layout. To customize the base layout:

1. Edit `src/lib/email-templates/base-template.ts`
2. Modify header, footer, or global styles
3. All templates will inherit the changes

### Individual Templates
Each template can be customized independently:

- `booking-confirmation.ts` - Client booking emails
- `admin-booking-notification.ts` - Admin notifications
- `contact-auto-reply.ts` - Contact form auto-replies
- `contact-admin-notification.ts` - Contact form admin alerts

## 🚀 Integration

### Using in API Routes

```typescript
import { sendClientConfirmationEmail } from "@/lib/email";

// In your API route
await sendClientConfirmationEmail({
  clientName: booking.clientName,
  clientEmail: booking.clientEmail,
  serviceName: booking.serviceName,
  slotLabel: booking.sessionDate,
  timezone: "GMT",
  isPaid: true,
  amount: 150,
});
```

### Using in Contact Forms

```typescript
import { sendContactAutoReply, sendContactAdminNotification } from "@/lib/email";

// Send auto-reply to client
await sendContactAutoReply({
  name: formData.name,
  email: formData.email,
  subject: formData.subject,
  message: formData.message,
});

// Send notification to admin
await sendContactAdminNotification({
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  subject: formData.subject,
  message: formData.message,
});
```

## 📚 Best Practices

1. **Always test emails** before deploying changes
2. **Keep content concise** - email clients have limits
3. **Use semantic HTML** for accessibility
4. **Test on multiple devices** and email clients
5. **Monitor deliverability** and open rates
6. **Update branding consistently** across all templates

## 🔧 Troubleshooting

### Emails not sending?
- Check `RESEND_API_KEY` is set correctly
- Verify `RESEND_FROM_EMAIL` domain is verified in Resend
- Check Resend dashboard for error logs

### Template looks wrong?
- Generate HTML preview to debug locally
- Check for inline CSS (required for email)
- Test in different email clients

### Need to debug?
```bash
# Generate previews and open in browser
npm run test:emails
open email-previews/booking-confirmation-single.html
```

## 📄 License

Copyright © 2024 SuperLife Coaching. All rights reserved.
