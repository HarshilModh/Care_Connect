import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Users,
  Settings,
  Shield,
  CheckCircle2,
  Filter,
} from "lucide-react";

const FamilyGroups = () => {
  const [familyGroups, setFamilyGroups] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRaw = localStorage.getItem("user") || "";
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?._id || "";
      setCurrentUserId(userId);

      if (!userId) {
        setFamilyGroups([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/api/family-groups/user/${userId}`,
        { withCredentials: true }
      );

      const groups = response.data.familyGroups ?? response.data ?? [];
      setFamilyGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        "Error fetching family groups"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleEdit = (groupId) => {
    navigate(`/groups/edit/${groupId}`);
  };

  const handleDelete = async (groupId) => {
    const ok = window.confirm(
      "Are you sure you want to delete this group? This cannot be undone."
    );
    if (!ok) return;

    try {
      await axios.delete(
        `http://localhost:3000/api/family-groups/group/${groupId}`,
        { withCredentials: true }
      );
      setFamilyGroups((prev) => prev.filter((g) => (g._id || g.id) !== groupId));
    } catch (err) {
      console.error("Failed to delete group:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to delete group"
      );
    }
  };

  // Normalize backend data for UI
  const normalizedGroups = familyGroups.map((g) => {
    const id = g._id || g.id;
    const createdById =
      (typeof g.createdBy === "object" ? g.createdBy._id : g.createdBy) ||
      g.createdById;

    const membership = g.membership || {};
    const role = membership.role || g.role || "member";
    const onboarding =
      membership.onboardingStatus &&
        membership.onboardingStatus !== "not_required"
        ? membership.onboardingStatus
        : "completed";
    const membershipStatus = membership.status || "active";
    const membersCount = g.memberCount || g.members?.length || 0;

    return {
      id,
      name: g.groupName,
      description: g.description,
      isPublic: g.isPublic,
      createdAt: g.createdAt,
      members: membersCount,
      role,
      onboarding,
      membershipStatus,
      isOwner: createdById === currentUserId,
    };
  });

  const filteredGroups = normalizedGroups.filter((g) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      g.name?.toLowerCase().includes(term) ||
      g.description?.toLowerCase().includes(term)
    );
  });

  const handleCompleteOnboarding = (group) => {
    if (group.role === "careGiver") {
      navigate("/onboarding/caregiver");
    } else if (group.role === "careRecipient") {
      navigate(`/onboarding/carerecipient/${group.id}`);
    }
  };

  const getActionButtons = (group) => {
    const buttons = [];

    if (
      (group.role === "careGiver" || group.role === "careRecipient") &&
      group.onboarding === "required"
    ) {
      buttons.push(
        <button
          key="onboarding"
          onClick={() => handleCompleteOnboarding(group)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Complete Onboarding
        </button>
      );
    }

    if (group.onboarding === "completed" || group.role === "admin") {
      buttons.push(
        <button
          key="view-members"
          onClick={() => navigate(`/group-members/${group.id}`)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
        >
          View Members
        </button>
      );
    }

    if (group.isOwner) {
      buttons.push(
        <div key="settings-wrapper" className="relative">
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === group.id ? null : group.id)
            }
            className="px-5 py-2.5 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center justify-center gap-2 w-full"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          {openDropdown === group.id && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
              <button
                onClick={() => handleEdit(group.id)}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Group
              </button>
              <button
                onClick={() => handleDelete(group.id)}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Group
              </button>
            </div>
          )}
        </div>
      );
    }

    return buttons;
  };

  return (
    <main className="page bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-n max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Your Family Groups
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage groups you created or belong to. Complete onboarding, view
            members, or update settings.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3">
            {String(error)}
          </div>
        )}

        {/* Controls Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search group name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>

              <button
                onClick={() => navigate("/createGroup")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Group
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center text-gray-600 dark:text-gray-300 mt-6">
            Loading groups…
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGroups.length === 0 && !error && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
            You are not part of any family groups yet.
          </div>
        )}

        {/* Groups List */}
        {!loading && filteredGroups.length > 0 && (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {group.name}
                      </h3>
                      {group.isPublic && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700">
                          Public Group
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-sm flex-wrap">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Shield className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium capitalize">
                          {group.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>{group.members} members</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="capitalize">
                          {group.membershipStatus}
                        </span>
                      </div>
                      {(group.role === "careGiver" ||
                        group.role === "careRecipient") && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${group.onboarding === "completed"
                              ? "bg-green-50 text-green-700 border border-green-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-700"
                              }`}
                          >
                            Onboarding: {group.onboarding}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px] items-stretch">
                    {getActionButtons(group)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default FamilyGroups;