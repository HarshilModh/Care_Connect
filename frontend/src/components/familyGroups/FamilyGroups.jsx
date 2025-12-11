import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Users,
  Settings,
  Shield,
  CheckCircle2,
  MoreVertical,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Edit,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";

const FamilyGroups = () => {
  const [familyGroups, setFamilyGroups] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const navigate = useNavigate();

  const loadGroups = async () => {
    setLoading(true);
    try {
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?._id;
      setCurrentUserId(userId);

      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await api.get(`/family-groups/user/${userId}`);

      const groups = response.data.familyGroups ?? response.data ?? [];
      setFamilyGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      setError(err.response?.data?.error || "Error fetching family groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleEdit = (groupId) => navigate(`/groups/edit/${groupId}`);

  const handleDelete = async (groupId) => {
    if (!window.confirm("Delete this group? This action cannot be undone."))
      return;
    try {
      await api.delete(`/family-groups/group/${groupId}`);
      setFamilyGroups((prev) =>
        prev.filter((g) => (g._id || g.id) !== groupId)
      );
      toast.success("Group deleted successfully");
    } catch (err) {
      toast.error("Failed to delete group");
    }
  };

  // Processing Data
  const normalizedGroups = familyGroups.map((g) => {
    const id = g._id || g.id;
    const createdById =
      (typeof g.createdBy === "object" && g.createdBy
        ? g.createdBy._id
        : g.createdBy) || g.createdById;
    const membership = g.membership || {};

    return {
      id,
      name: g.groupName,
      description: g.description,
      isPublic: g.isPublic,
      createdAt: g.createdAt,
      membersCount: g.memberCount || g.members?.length || 0,
      role: membership.role || g.role || "member",
      onboarding:
        membership.onboardingStatus &&
        membership.onboardingStatus !== "not_required"
          ? membership.onboardingStatus
          : "completed",
      status: membership.status || "active",
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

  // Render Helpers
  const getRoleBadge = (role) => {
    const config = {
      admin: "bg-purple-100 text-purple-700 border-purple-200",
      careGiver: "bg-blue-100 text-blue-700 border-blue-200",
      careRecipient: "bg-amber-100 text-amber-700 border-amber-200",
      member: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return config[role] || config.member;
  };

  const GroupSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
      <div className="flex gap-2 mt-auto">
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Groups</h1>
            <p className="text-gray-500 mt-2 text-lg">
              Manage your care circles and memberships.
            </p>
          </div>
          <button
            onClick={() => navigate("/createGroup")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Create Group
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 mb-8 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-gray-50 transition-colors"
            />
          </div>
          <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
          <span className="text-sm text-gray-500 font-medium px-4 hidden sm:block">
            {filteredGroups.length} Groups
          </span>
        </div>

        {/* Content Area */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GroupSkeleton />
            <GroupSkeleton />
            <GroupSkeleton />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No groups found
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              You haven't joined or created any family groups yet. Get started
              by creating one.
            </p>
            <button
              onClick={() => navigate("/createGroup")}
              className="text-indigo-600 font-medium hover:underline"
            >
              Create a new group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="group relative bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getRoleBadge(
                        group.role
                      )}`}
                    >
                      {group.role}
                    </span>

                    {/* Context Menu */}
                    {group.isOwner && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(
                              activeDropdown === group.id ? null : group.id
                            );
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeDropdown === group.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(group.id);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Edit Group
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(group.id);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Group
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <h3
                    className="text-xl font-bold text-gray-900 mb-2 truncate"
                    title={group.name}
                  >
                    {group.name}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 h-10 mb-4">
                    {group.description || "No description provided."}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5" title="Members">
                      <Users className="w-4 h-4" />
                      <span>{group.membersCount}</span>
                    </div>
                    {group.isPublic && (
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                        Public
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer / Actions */}
                <div className="mt-auto p-6 pt-0">
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                    {/* Priority Action: Onboarding */}
                    {["careGiver", "careRecipient"].includes(group.role) &&
                    group.onboarding === "required" ? (
                      <button
                        onClick={() => {
                          if (group.role === "careGiver")
                            navigate("/onboarding/caregiver");
                          else
                            navigate(`/onboarding/carerecipient/${group.id}`);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        Complete Setup <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      // Standard Action: View (Only for Admins)
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() =>
                            navigate(`/groups/details/${group.id}`)
                          }
                          className="w-full py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-semibold rounded-xl transition-colors border border-indigo-200"
                        >
                          Group Details
                        </button>

                        {(group.role === "admin" || group.isOwner) && (
                          <button
                            onClick={() =>
                              navigate(`/group-members/${group.id}`)
                            }
                            className="w-full py-2.5 bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 text-sm font-semibold rounded-xl transition-colors border border-gray-200 hover:border-indigo-200"
                          >
                            View Members
                          </button>
                        )}
                      </div>
                    )}
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
