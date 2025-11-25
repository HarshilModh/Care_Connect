import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BellIcon } from "@heroicons/react/24/outline";
import { getUnreadCount } from "../api/notifications";
import { useAuth } from "../context/AuthContext";

const NotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    const userId = user?.userId || user?._id;

    if (!userId) {
      console.log("No user ID available for notifications");
      return;
    }

    try {
      const data = await getUnreadCount(userId);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      title="Notifications"
      aria-label={`Notifications ${
        unreadCount > 0 ? `(${unreadCount} unread)` : ""
      }`}
    >
      <BellIcon className="w-5 h-5 text-slate-700 dark:text-slate-200" />

      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
