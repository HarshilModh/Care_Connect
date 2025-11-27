import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 FamilyGroups.jsx
 - lists groups created by current user
 - search and simple public filter
 - optimistic delete with rollback
 - safe requests using abort controller
*/

const ROLES_REQUIRING_ONBOARDING = ["careGiver", "careRecipient"];

const FamilyGroups = () => {
  const [familyGroups, setFamilyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState(""); // search text
  const [publicOnly, setPublicOnly] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  // fetch groups created by current user
  useEffect(() => {
    let mounted = true;
    const ctrl = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const userRaw = localStorage.getItem("user") || "";
        const user = userRaw ? JSON.parse(userRaw) : null;
        const userId = user?._id || "";
        if (!userId) {
          if (!mounted) return;
          setFamilyGroups([]);
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `http://localhost:3000/api/family-groups/creator/${userId}`,
          { withCredentials: true, signal: ctrl.signal }
        );

        const groups = res.data.familyGroups ?? res.data ?? [];
        if (!mounted) return;
        setFamilyGroups(Array.isArray(groups) ? groups : []);
      } catch (err) {
        if (axios.isCancel?.(err)) return;
        const msg =
          err?.response?.data?.error ?? err?.message ?? "Failed to load groups";
        if (!mounted) return;
        setError(msg);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, []);

  // derived filtered list
  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    return (familyGroups || [])
      .filter((g) => {
        if (publicOnly && !g.isPublic) return false;
        if (!qlc) return true;
        return (
          (g.groupName ?? "").toLowerCase().includes(qlc) ||
          (g.description ?? "").toLowerCase().includes(qlc)
        );
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [familyGroups, q, publicOnly]);

  // navigate to edit
  const handleEdit = (groupId) => navigate(`/groups/edit/${groupId}`);

  // optimistic delete
  const handleDelete = async (groupId, groupName) => {
    const ok = window.confirm(
      `Delete group "${groupName}"? This cannot be undone.`
    );
    if (!ok) return;

    const prev = familyGroups;
    setDeletingId(groupId);
    setFamilyGroups((p) => p.filter((g) => (g._id || g.id) !== groupId));

    try {
      await axios.delete(`http://localhost:3000/api/family-groups/group/${groupId}`, { withCredentials: true })
      toast.success("Group deleted")
    } catch (err) {
      // rollback on failure
      setFamilyGroups(prev);
      const msg =
        err?.response?.data?.error ?? err?.message ?? "Failed to delete group";
      toast.error(msg);
    } finally {
      setDeletingId(null);
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
        <header className="text-center mb-8">
          <h1 className="section-title">Your family groups</h1>
          <p className="section-sub">
            Manage groups you created. Add members, edit, or delete when needed.
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* search and actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="search"
                className="input input-compact"
                placeholder="Search group name or description"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ minWidth: 240 }}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={publicOnly}
                  onChange={(e) => setPublicOnly(e.target.checked)}
                />
                Public only
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="btn-primary"
                onClick={() => navigate("/createGroup")}
              >
                Create group
              </button>
            </div>
          </div>

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
                      className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-semibold truncate">
                            {group.groupName}
                          </h2>
                          {group.isPublic && (
                            <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-gray-100">
                              Public
                            </span>
                          )}
                        </div>

                        {group.description && (
                          <p className="text-slate-600 mt-2 truncate">
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
                })}
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </main>
  );
};

export default FamilyGroups;
