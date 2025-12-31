import type { User } from "@supabase/supabase-js";

interface AdminHeaderProps {
  user?: User;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1" />

        {/* User info */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {user?.user_metadata?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#C5A028] flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
