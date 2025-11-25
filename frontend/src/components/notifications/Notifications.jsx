import React, { useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { getUserNotifications, markAllAsRead } from "../../api/notifications";
import { useAuth } from "../../context/AuthContext";
import NotificationItem from "./NotificationItem";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const userId = user?.userId || user?._id;

  const loadNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters = {};

      if (filter === "unread") {
        filters.isRead = false;
      } else if (filter === "join_requests") {
        filters.type = "join_request";
        filters.actionStatus = "pending";
      }

      const data = await getUserNotifications(userId, filters);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load notifications"
      );
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user, filter]);

  const handleMarkAllRead = async () => {
    if (!userId) return;

    try {
      await markAllAsRead(userId);
      toast.success("All notifications marked as read");
      loadNotifications();
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="page">
      <div className="container-n">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="section-title flex items-center gap-2">
                <BellIcon className="h-8 w-8 text-indigo-600" />
                Notifications
              </h1>
              <p className="section-sub">
                Stay updated with your care coordination activities
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="
                  px-4 py-2 text-sm font-medium
                  text-indigo-600 dark:text-indigo-400
                  hover:text-indigo-700 dark:hover:text-indigo-300
                  transition-colors
                "
              >
                Mark all as read
              </button>
            )}
          </div>
        </header>

        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilter("all")}
            className={`
              px-4 py-2 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${
                filter === "all"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }
            `}
          >
            All
            {filter === "all" && notifications.length > 0 && (
              <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter("unread")}
            className={`
              px-4 py-2 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${
                filter === "unread"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }
            `}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter("join_requests")}
            className={`
              px-4 py-2 text-sm font-medium transition-colors
              border-b-2 -mb-px
              ${
                filter === "join_requests"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }
            `}
          >
            Join Requests
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Loading notifications...
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto mb-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <BellIcon className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                  No notifications
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  {filter === "unread" && "You're all caught up!"}
                  {filter === "join_requests" && "No pending join requests"}
                  {filter === "all" && "You don't have any notifications yet"}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  userId={userId}
                  onUpdate={loadNotifications}
                />
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Notifications;
