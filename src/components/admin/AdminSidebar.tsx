import { useState } from "react";
import { cn } from "../../lib/utils";
import { LayoutDashboard, Calendar, CreditCard, LogOut, Menu, X } from "lucide-react";

interface AdminSidebarProps {
  activePage?: "dashboard" | "bookings" | "payments";
}

const iconMap = {
  dashboard: LayoutDashboard,
  bookings: Calendar,
  payments: CreditCard,
};

export default function AdminSidebar({ activePage = "dashboard" }: AdminSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", iconKey: "dashboard" as const, key: "dashboard" as const },
    { name: "Bookings", href: "/admin/bookings", iconKey: "bookings" as const, key: "bookings" as const },
    { name: "Payments", href: "/admin/payments", iconKey: "payments" as const, key: "payments" as const },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              SuperLife<span className="text-[#D4AF37]">®</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">Admin Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-5 space-y-2">
            {navigation.map((item) => {
              const isActive = activePage === item.key;
              const Icon = iconMap[item.iconKey];
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group",
                    isActive
                      ? "bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 text-[#D4AF37] font-semibold shadow-sm border border-[#D4AF37]/20"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "scale-110" : "group-hover:scale-105"
                  )} />
                  <span className="text-sm font-medium">{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-105 transition-transform" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
