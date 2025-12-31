/**
 * Test Email Templates Script
 *
 * This script tests all email templates by generating HTML previews
 * and optionally sending test emails.
 *
 * Usage:
 *   npm run test:emails              - Generate HTML previews
 *   npm run test:emails -- --send    - Send actual test emails
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  generateBookingConfirmationEmail,
  generateAdminBookingNotification,
  generateContactAutoReply,
  generateContactAdminNotification,
} from "../src/lib/email-templates";

// Test data
const testBookingData = {
  clientName: "John Smith",
  clientEmail: "john.smith@example.com",
  clientPhone: "+44 7700 900123",
  serviceName: "Executive Life Coaching",
  sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  sessionTime: "10:00 AM GMT",
  sessionDuration: "60 minutes",
  packageSessions: 1,
  price: 150,
  paymentStatus: "paid" as const,
  bookingReference: "SLC-2024-001",
  bookingId: "booking_123456",
  notes: "Looking forward to discussing career transition goals.",
};

const testPackageData = {
  ...testBookingData,
  serviceName: "Premium Coaching Package",
  packageSessions: 6,
  price: 750,
  notes: "6-session package focusing on leadership development.",
};

const testContactData = {
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  phone: "+44 7700 900456",
  subject: "Interested in Executive Coaching",
  message: "Hi, I'm interested in learning more about your executive coaching services. I'm currently in a senior management role and looking to develop my leadership skills further. Could we schedule a discovery call?\n\nBest regards,\nSarah",
};

// Generate email templates
function generateEmailPreviews() {
  console.log("🎨 Generating email template previews...\n");

  // Create output directory
  const outputDir = join(process.cwd(), "email-previews");
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  const templates = [
    {
      name: "booking-confirmation-single",
      description: "Client Booking Confirmation (Single Session)",
      html: generateBookingConfirmationEmail(testBookingData),
    },
    {
      name: "booking-confirmation-package",
      description: "Client Booking Confirmation (Package)",
      html: generateBookingConfirmationEmail(testPackageData),
    },
    {
      name: "admin-booking-notification",
      description: "Admin Booking Notification",
      html: generateAdminBookingNotification({
        ...testBookingData,
        paymentStatus: "paid",
      }),
    },
    {
      name: "admin-booking-notification-pending",
      description: "Admin Booking Notification (Pending Payment)",
      html: generateAdminBookingNotification({
        ...testBookingData,
        paymentStatus: "pending",
      }),
    },
    {
      name: "contact-auto-reply",
      description: "Contact Form Auto-Reply",
      html: generateContactAutoReply(testContactData),
    },
    {
      name: "contact-admin-notification",
      description: "Contact Form Admin Notification",
      html: generateContactAdminNotification(testContactData),
    },
  ];

  // Generate HTML files
  templates.forEach((template) => {
    const filename = `${template.name}.html`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, template.html, "utf-8");
    console.log(`✅ ${template.description}`);
    console.log(`   📄 ${filepath}\n`);
  });

  console.log("\n🎉 All email previews generated successfully!");
  console.log(`📁 Output directory: ${outputDir}\n`);
  console.log("💡 Open the HTML files in your browser to preview the emails.\n");
}

// Send test emails (requires RESEND_API_KEY in .env)
async function sendTestEmails() {
  console.log("📧 Sending test emails...\n");

  try {
    const {
      sendClientConfirmationEmail,
      sendAdminNotificationEmail,
      sendContactAutoReply,
      sendContactAdminNotification,
    } = await import("../src/lib/email");

    const testEmail = process.env.TEST_EMAIL || "test@example.com";
    console.log(`📬 Sending test emails to: ${testEmail}\n`);

    // Test booking confirmation
    console.log("1️⃣ Sending booking confirmation...");
    await sendClientConfirmationEmail({
      clientName: testBookingData.clientName,
      clientEmail: testEmail,
      serviceName: testBookingData.serviceName,
      slotLabel: testBookingData.sessionDate,
      timezone: "GMT",
      totalSessions: testBookingData.packageSessions,
      isPaid: true,
      amount: testBookingData.price,
    });
    console.log("   ✅ Sent!\n");

    // Test admin notification
    console.log("2️⃣ Sending admin notification...");
    await sendAdminNotificationEmail({
      clientName: testBookingData.clientName,
      clientEmail: testBookingData.clientEmail,
      serviceName: testBookingData.serviceName,
      slotLabel: testBookingData.sessionDate,
      timezone: "GMT",
      totalSessions: testBookingData.packageSessions,
      isPaid: true,
      amount: testBookingData.price,
      bookingId: testBookingData.bookingId,
    });
    console.log("   ✅ Sent!\n");

    // Test contact auto-reply
    console.log("3️⃣ Sending contact auto-reply...");
    await sendContactAutoReply({
      name: testContactData.name,
      email: testEmail,
      subject: testContactData.subject,
      message: testContactData.message,
    });
    console.log("   ✅ Sent!\n");

    // Test contact admin notification
    console.log("4️⃣ Sending contact admin notification...");
    await sendContactAdminNotification(testContactData);
    console.log("   ✅ Sent!\n");

    console.log("🎉 All test emails sent successfully!\n");
  } catch (error) {
    console.error("❌ Error sending test emails:", error);
    console.error("\n💡 Make sure you have:");
    console.error("   - RESEND_API_KEY in your .env file");
    console.error("   - RESEND_FROM_EMAIL configured");
    console.error("   - BOOKING_ADMIN_EMAIL configured");
    console.error("   - TEST_EMAIL environment variable (optional)\n");
    process.exit(1);
  }
}

// Main execution
async function main() {
  const shouldSend = process.argv.includes("--send");

  if (shouldSend) {
    await sendTestEmails();
  } else {
    generateEmailPreviews();
    console.log("💡 To send actual test emails, run:");
    console.log("   npm run test:emails -- --send\n");
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
