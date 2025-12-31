import type { Tables } from "./database";

export type BookingWithUser = Tables<"bookings"> & {
  users: Pick<Tables<"users">, "id" | "name" | "email" | "phone"> | null;
};

export type DashboardStats = {
  totalBookings: number;
  totalRevenue: number;
  upcomingSessions: number;
};

export type ChartDataPoint = {
  date: string;
  revenue: number;
};
