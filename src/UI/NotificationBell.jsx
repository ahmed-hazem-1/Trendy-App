import { Bell } from "lucide-react";
import { useUnreadNotificationCount } from "../hooks/useNews";

export default function NotificationBell() {
  const { data: count = 0 } = useUnreadNotificationCount();

  return (
    <button className="relative cursor-pointer p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition">
      <Bell className="h-6 w-6" strokeWidth={1.5} />
      {count > 0 && (
        <span className="absolute top-1 inset-s-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </button>
  );
}
