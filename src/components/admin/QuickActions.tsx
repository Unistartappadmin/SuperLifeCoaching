import { Card } from "../ui/card";
import { Calendar, CreditCard } from "lucide-react";

interface QuickActionsProps {
  data: {
    totalBookings?: number;
    totalRevenue?: number;
  };
}

export default function QuickActions({ data }: QuickActionsProps) {
  const actions = [
    {
      title: "View All Bookings",
      subtitle: `${data.totalBookings || 0} total`,
      href: "/admin/bookings",
      icon: Calendar,
    },
    {
      title: "Payment History",
      subtitle: `£${(data.totalRevenue || 0).toLocaleString()} total`,
      href: "/admin/payments",
      icon: CreditCard,
    },
  ];

  return (
    <Card className="p-6 border-2 border-gray-200/50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <a
              key={action.title}
              href={action.href}
              className="block p-3.5 rounded-xl hover:bg-gradient-to-r hover:from-[#D4AF37]/10 hover:to-[#D4AF37]/5 transition-all group border border-transparent hover:border-[#D4AF37]/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-gray-200/50">
                  <Icon className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{action.title}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{action.subtitle}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </Card>
  );
}
