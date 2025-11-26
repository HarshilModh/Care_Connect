import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { getUnreadCount } from "../../api/chatApi";

const GroupList = ({ onSelectGroup, selectedGroupId }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);

        // Use user from context or fallback to localStorage
        let currentUser = user;
        if (!currentUser?._id) {
          const userRaw = localStorage.getItem("user");
          if (userRaw) {
            currentUser = JSON.parse(userRaw);
          }
        }

        if (!currentUser?._id) {
          console.log("No user found, skipping group fetch");
          setLoading(false);
          return;
        }

        // 🔥 ADD LOGGING TO DEBUG
        console.log("Fetching groups for user:", currentUser._id);
        const response = await api.get(`/family-groups/user/${currentUser._id}`);
        console.log("Groups response:", response.data);

        // Handle different response structures
        const groupsData = response.data?.data || response.data?.groups || response.data || [];
        console.log("Extracted groups:", groupsData);

        setGroups(groupsData);

        // Fetch unread counts for each group
        const counts = {};
        for (const group of groupsData) {
          try {
            const countRes = await getUnreadCount(group._id);
            counts[group._id] = countRes?.data?.unreadCount || 0;
          } catch (err) {
            console.error(`Failed to get unread count for group ${group._id}:`, err);
            counts[group._id] = 0;
          }
        }
        setUnreadCounts(counts);
      } catch (error) {
        console.error("Error fetching groups:", error);
        console.error("Error response:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-1)]"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
        <p className="text-gray-600">Join or create a family group to start chatting</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-[var(--border)]">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] bg-clip-text text-transparent">
          Chats
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">{groups.length} active conversations</p>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {groups.map((group) => {
          const isSelected = selectedGroupId === group._id;
          const unreadCount = unreadCounts[group._id] || 0;
          const initials = group.groupName?.substring(0, 2).toUpperCase() || "GR";

          return (
            <div
              key={group._id}
              onClick={() => onSelectGroup(group)}
              className={`
                group relative p-4 rounded-2xl cursor-pointer transition-all duration-200
                ${isSelected
                  ? "bg-gradient-to-r from-[var(--brand-1)]/10 to-[var(--brand-2)]/10 shadow-sm"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }
              `}
            >
              {/* Active Indicator Line */}
              {isSelected && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b from-[var(--brand-1)] to-[var(--brand-2)]" />
              )}

              <div className="flex items-center gap-4">
                {/* Avatar Placeholder */}
                <div className={`
                  h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-105
                  ${isSelected
                    ? "bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }
                `}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-semibold truncate ${isSelected ? "text-[var(--brand-1)]" : "text-[var(--text-main)]"}`}>
                      {group.groupName || group.name}
                    </h3>
                    {/* Optional: Time of last message could go here */}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate max-w-[80%]">
                      {group.description || "No description"}
                    </p>

                    {unreadCount > 0 && (
                      <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-[var(--brand-1)] text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupList;