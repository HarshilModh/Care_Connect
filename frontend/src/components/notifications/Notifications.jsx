import React, { useState, useEffect } from "react";
import { 
  Bell, 
  CheckCheck, 
  Filter, 
  UserPlus, 
  Inbox, 
  RefreshCw 
} from "lucide-react";
import { toast } from "react-toastify";
import { getUserNotifications, markAllAsRead } from "../../api/notifications";
import { useAuth } from "../../context/AuthContext";
import NotificationItem from "./NotificationItem";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const userId = user?.userId || user?._id;

  const loadNotifications = async (isRefresh = false) => {
    if (!userId) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
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
      setError(err.response?.data?.error || "Failed to load notifications");
      // Only toast on manual refresh to avoid annoyance on initial load
      if(isRefresh) toast.error("Could not refresh notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId, filter]);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead(userId);
      toast.success("All notifications marked as read");
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      toast.error("Failed to mark all as read");
      loadNotifications(); // Revert on error
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Render Helpers
  const renderEmptyState = () => {
    const emptyConfig = {
      all: {
        icon: Inbox,
        title: "No notifications",
        desc: "You don't have any activity yet."
      },
      unread: {
        icon: CheckCheck,
        title: "All caught up!",
        desc: "You have no unread notifications."
      },
      join_requests: {
        icon: UserPlus,
        title: "No pending requests",
        desc: "There are no new family join requests."
      }
    };

    const config = emptyConfig[filter];
    const Icon = config.icon;

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-200 border-dashed">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
        <p className="text-gray-500 mt-1 max-w-xs mx-auto">{config.desc}</p>
        <button 
          onClick={() => loadNotifications(true)}
          className="mt-6 text-blue-600 font-medium text-sm hover:underline"
        >
          Refresh check
        </button>
      </div>
    );
  };

  const NotificationSkeleton = () => (
    <div className="animate-pulse flex gap-4 p-4 border-b border-gray-100 last:border-0">
      <div className="h-10 w-10 bg-gray-200 rounded-full flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-1">Stay updated with your care group.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadNotifications(true)}
                className={`p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all ${refreshing ? 'animate-spin' : ''}`}
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Filters (Segmented Control) */}
        <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 mb-6 flex overflow-x-auto">
          {[
            { id: 'all', label: 'All', icon: Inbox },
            { id: 'unread', label: 'Unread', icon: Bell },
            { id: 'join_requests', label: 'Requests', icon: UserPlus },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${filter === tab.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <tab.icon className={`w-4 h-4 ${filter === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-800">
            <div className="mt-0.5 font-bold">!</div>
            <div>
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => loadNotifications()} className="text-xs underline mt-1">Try again</button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="divide-y divide-gray-100">
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </div>
          ) : notifications.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  userId={userId}
                  onUpdate={() => loadNotifications()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;