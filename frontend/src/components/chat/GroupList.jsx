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

        const response = await api.get(`/family-groups/user/${currentUser._id}`);
        

        // Handle different response structures
        const groupsData = response.data?.data || response.data?.groups || response.data || [];

        setGroups(groupsData);

        for (const group of groupsData) {
          console.log(`Fetched group: ${group.groupName || group.name} (ID: ${group._id})`);
          let membership = await api.get(`/family-groups/group/${group._id}/members`);
          console.log(`Membership for group ${group._id}:`, membership.data.members);
          //current user membership details can be found in membership.data
          // console.log(`Checking membership for user ${currentUser._id} in group ${group._id}`);
          membership = membership.data.members.find(m => m.userId._id === currentUser._id);
          console.log(`Current user membership for group ${group._id}:`, membership);
          //remove from group data if onboardingStatus ===required "required"
          if (membership?.onboardingStatus === "required") {
            console.log(`Removing group ${group._id} from list due to onboardingStatus 'required'`);
            setGroups(prevGroups => prevGroups.filter(g => g._id !== group._id));
          }
        }

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
        <div className="text-6xl mb-4 opacity-50">💬</div>
        <h3 className="text-xl font-semibold mb-2 text-[var(--text-main)]">No Groups Yet</h3>
        <p className="text-gray-500 text-sm">Join or create a family group to start chatting</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-[var(--border)]">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border)] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] bg-clip-text text-transparent">
          Messages
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">{groups.length} conversations</p>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {groups.map((group) => {
          const isSelected = selectedGroupId === group._id;
          const unreadCount = unreadCounts[group._id] || 0;
          const initials = group.groupName?.substring(0, 2).toUpperCase() || "GR";

          return (
            <div
              key={group._id}
              onClick={() => onSelectGroup(group)}
              className={`
                group relative p-3 rounded-xl cursor-pointer transition-all duration-200
                ${isSelected
                  ? "bg-[var(--brand-1)]/10 dark:bg-[var(--brand-1)]/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`
                  h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform duration-300 group-hover:scale-105
                  ${isSelected
                    ? "bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] text-white shadow-md ring-2 ring-[var(--brand-1)]/20"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-white group-hover:shadow-md dark:group-hover:bg-gray-700"
                  }
                `}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-semibold truncate text-sm ${isSelected ? "text-[var(--brand-1)]" : "text-[var(--text-main)]"}`}>
                      {group.groupName || group.name}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-[var(--brand-1)]">
                        New
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate max-w-[85%] ${isSelected ? "text-[var(--brand-1)]/80" : "text-gray-500"}`}>
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