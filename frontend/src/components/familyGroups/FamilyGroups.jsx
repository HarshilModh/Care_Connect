import axios from 'axios';
import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FamilyGroups = () => {
  const [familyGroups, setFamilyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRaw = localStorage.getItem('user') || "";
      const user = userRaw ? JSON.parse(userRaw) : null;
      const userId = user?._id || "";
      if (!userId) {
        setFamilyGroups([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:3000/api/family-groups/creator/${userId}`);
      // support both { familyGroups: [...] } and raw array responses
      const groups = response.data.familyGroups ?? response.data ?? [];
      setFamilyGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Error fetching family groups");
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
    const ok = window.confirm("Are you sure you want to delete this group? This cannot be undone.");
    if (!ok) return;

    try {
      // call backend delete endpoint. adjust path if your API differs
      await axios.delete(`http://localhost:3000/api/family-groups/${groupId}`);
      // remove from UI
      setFamilyGroups(prev => prev.filter(g => (g._id || g.id) !== groupId));
    } catch (err) {
      console.error("Failed to delete group:", err);
      setError(err.response?.data?.error || err.message || "Failed to delete group");
    }
  };

  return (
    <main className="page">
      <div className="container-n">

        {/* Page Header */}
        <header className="text-center mb-8">
          <h1 className="section-title">Your Family Groups</h1>
          <p className="section-sub">Manage and organize all caregiving groups you created.</p>
        </header>

        {/* Loading + Error States */}
        {loading && (
          <div className="text-center mt-6">
            <p className="text-slate-600 dark:text-slate-300">Loading family groups…</p>
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
                  You have not created any family groups yet.
                </p>
              </div>
            ) : (
              familyGroups.map((group) => {
                const id = group._id || group.id;
                return (
                  <div key={id} className="card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {group.groupName}
                      </h2>

                      {group.description && (
                        <p className="text-slate-600 dark:text-slate-300 mb-3">
                          {group.description}
                        </p>
                      )}

                      <div className="mt-2 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <p>
                          <span className="font-semibold">Public:</span>{" "}
                          {group.isPublic ? "Yes" : "No"}
                        </p>
                        <p>
                          <span className="font-semibold">Created:</span>{" "}
                          {group.createdAt ? new Date(group.createdAt).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                      {/* group-members/:groupId */}
                      <button
                        type="button"
                        onClick={() => navigate(`/group-members/${id}`)}
                        className="btn-primary"
                        title="View group members"
                      >
                        View Members
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
