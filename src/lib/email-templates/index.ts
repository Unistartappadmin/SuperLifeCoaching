/**
 * SuperLife Coaching Email Templates
 * Ultra-premium email templates with consistent branding
 */

export { generateBaseEmailTemplate } from "./base-template";
export { generateBookingConfirmationEmail } from "./booking-confirmation";
export { generateAdminBookingNotification } from "./admin-booking-notification";
export { generateContactAutoReply } from "./contact-auto-reply";
export { generateContactAdminNotification } from "./contact-admin-notification";

// Re-export types for convenience
export type { default as BookingConfirmationData } from "./booking-confirmation";
export type { default as AdminBookingNotificationData } from "./admin-booking-notification";
export type { default as ContactAutoReplyData } from "./contact-auto-reply";
export type { default as ContactAdminNotificationData } from "./contact-admin-notification";
