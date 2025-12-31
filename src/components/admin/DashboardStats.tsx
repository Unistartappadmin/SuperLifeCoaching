import { Card } from "../ui/card";
import type { DashboardStats as StatsType } from "../../types/admin";
import { BarChart3, Coins, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardStatsProps {
  stats: StatsType;
}

interface StatCard {
  title: string;
  value: string;
  icon: LucideIcon;
  bgGradient: string;
  borderColor: string;
  description: string;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards: StatCard[] = [
    {
      title: "Total Bookings",
      value: stats.totalBookings.toString(),
      icon: BarChart3,
      bgGradient: "from-gray-50 to-gray-100",
      borderColor: "border-gray-200/50",
      description: "All time bookings",
    },
    {
      title: "Total Revenue",
      value: `£${stats.totalRevenue.toLocaleString()}`,
      icon: Coins,
      bgGradient: "from-[#D4AF37]/5 to-[#D4AF37]/10",
      borderColor: "border-[#D4AF37]/20",
      description: "Lifetime earnings",
    },
    {
      title: "Upcoming Sessions",
      value: stats.upcomingSessions.toString(),
      icon: CalendarClock,
      bgGradient: "from-gray-50 to-gray-100",
      borderColor: "border-gray-200/50",
      description: "Next 30 days",
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6 border-2 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-3 mb-2">{stat.value}</p>
                <p className="text-xs text-gray-600 font-medium">{stat.description}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.bgGradient} border-2 ${stat.borderColor} flex items-center justify-center`}
              >
                <Icon className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
