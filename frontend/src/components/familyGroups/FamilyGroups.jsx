import axios from "axios";
import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ROLES_REQUIRING_ONBOARDING = ["careGiver", "careRecipient"];

const FamilyGroups = () => {
  const [familyGroups, setFamilyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const navigate = useNavigate();

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRaw = localStorage.getItem("user") || "";
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?._id || "";
      console.log("userId", userId)

      setCurrentUserId(userId);
      if (!userId) {
        setFamilyGroups([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/api/family-groups/user/${userId}`
      );
      console.log("get user groups", response);
      // support both { familyGroups: [...] } and raw array responses
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

  // Navigate to edit page. Adjust route if needed.
  const handleEdit = (groupId) => {
    navigate(`/groups/edit/${groupId}`);
  };

  // Delete with confirmation and optimistic UI update
  const handleDelete = async (groupId) => {
    const ok = window.confirm(
      "Are you sure you want to delete this group? This cannot be undone."
    );
    if (!ok) return;

    try {
      // call backend delete endpoint. adjust path if your API differs
      await axios.delete(
        `http://localhost:3000/api/family-groups/group/${groupId}`,
        { withCredentials: true }
      );
      // remove from UI
      setFamilyGroups((prev) =>
        prev.filter((g) => (g._id || g.id) !== groupId)
      );
    } catch (err) {
      console.error("Failed to delete group:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to delete group"
      );
    }
  };

  const handleOpenGroup = (group) => {
    const groupId = group._id || group.id;
    const membership = group.membership || {};
    const role = membership.role;
    const membershipStatus = membership.status;
    const onboardingStatus = membership.onboardingStatus;

    const needsOnboarding =
      membershipStatus === "active" &&
      ROLES_REQUIRING_ONBOARDING.includes(role) &&
      onboardingStatus === "required";

    if (needsOnboarding) {
      // redirect to right onboarding flow
      if (role === "careGiver") {
        navigate("/onboarding/caregiver");
      } else if (role === "careRecipient") {
        navigate(`/onboarding/recipient/${groupId}`);
      } else {
        // fallback: just go to members
        navigate(`/group-members/${groupId}`);
      }
    } else {
      // normal behavior
      navigate(`/group-members/${groupId}`);
    }
  };

  return (
    <main className="page">
      <div className="container-n">
        {/* Page Header */}
        <header className="text-center mb-8">
          <h1 className="section-title">Your Family Groups</h1>
          <p className="section-sub">
            Manage and access the caregiving groups you&apos;re part of.
          </p>
        </header>

        {/* Loading + Error States */}
        {loading && (
          <div className="text-center mt-6">
            <p className="text-slate-600 dark:text-slate-300">
              Loading family groups…
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto mb-4">
            <div className="alert-error">{String(error)}</div>
          </div>
        )}

        {/* Groups List */}
        {!loading && !error && (
          <div className="grid gap-6 max-w-3xl mx-auto">
            {familyGroups.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                  You are not a member of any family groups yet.
                </p>
              </div>
            ) : (
              familyGroups.map((group) => {
                console.log("group", group);
                const id = group._id || group.id;
                const createdById =
                  group.createdBy?._id ||
                  group.createdById ||
                  group.createdBy ||
                  "";

                const membership = group.membership || {};
                const role = membership.role || "member";
                const membershipStatus = membership.status || "pending";
                const onboardingStatus =
                  membership.onboardingStatus || "not_required";

                const isOwner = createdById === currentUserId;

                const needsOnboarding =
                  membershipStatus === "active" &&
                  ROLES_REQUIRING_ONBOARDING.includes(role) &&
                  onboardingStatus === "required";

                console.log("needsOnboarding", needsOnboarding)

                return (
                  <div
                    key={id}
                    className="card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {group.groupName}
                      </h2>

                      {group.description && (
                        <p className="text-slate-600 dark:text-slate-300 mb-3">
                          {group.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Role: {role}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Membership: {membershipStatus}
                        </span>
                        {ROLES_REQUIRING_ONBOARDING.includes(role) && (
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 ${onboardingStatus === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : onboardingStatus === "required"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                              }`}
                          >
                            Onboarding: {onboardingStatus}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <p>
                          <span className="font-semibold">Public:</span>{" "}
                          {group.isPublic ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="font-semibold">Created:</span>{" "}
                          {group.createdAt
                            ? new Date(group.createdAt).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(id)}
                            className="btn-ghost"
                            title="Edit group"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(id)}
                            className="btn-ghost text-red-600 border-red-200 hover:bg-red-50"
                            title="Delete group"
                          >
                            Delete
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenGroup(group)}
                        className="btn-primary"
                        title={
                          needsOnboarding
                            ? "Complete onboarding to access this group"
                            : "View group members"
                        }
                      >
                        {needsOnboarding ? "Complete onboarding" : "View Members"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default FamilyGroups;
