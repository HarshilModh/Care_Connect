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

          {/* loading */}
          {loading && (
            <div className="grid gap-4">
              <div className="h-28 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-28 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          )}

          {/* error */}
          {error && !loading && (
            <div className="mb-4">
              <div className="alert-error">{String(error)}</div>
            </div>
          )}

          {/* empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-slate-500">
                No groups found. Create your first group to get started.
              </p>
              <div className="mt-4">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/createGroup")}
                >
                  Create group
                </button>
              </div>
            </div>
          )}

          {/* list */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-4">
              {filtered.map((group) => {
                const id = group._id || group.id;
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

                      <div className="mt-2 text-sm text-slate-500">
                        Created:{" "}
                        {group.createdAt
                          ? new Date(group.createdAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="btn-ghost"
                        onClick={() => navigate(`/group-members/${id}`)}
                      >
                        Members
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => handleEdit(id)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn-ghost text-red-600 border-red-100 hover:bg-red-50"
                        onClick={() => handleDelete(id, group.groupName)}
                        disabled={deletingId === id}
                      >
                        {deletingId === id ? "Deleting…" : "Delete"}
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
