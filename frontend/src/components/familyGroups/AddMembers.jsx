import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

/**
 * Endpoints used
 *  GET  /api/users/search?q=term
 *  GET  /api/memberships/group/:groupId
 *  POST /api/memberships           body { groupId, userId, role }
 *  POST /api/invitations           body { groupId, email, role }
 */

async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed ${res.status}`);
  return data;
}

const ROLES = [
  { value: "family", label: "Family" },
  { value: "caregiver", label: "Caregiver" },
  { value: "owner", label: "Owner" },
];

export default function AddMembers() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const group = state?.group || null;

  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [members, setMembers] = useState([]); // existing memberships
  const [selected, setSelected] = useState([]); // items to add
  const [roleForInvite, setRoleForInvite] = useState("family");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // fetch existing members
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await api(`/api/memberships/group/${groupId}`);
        if (!ignore) setMembers(Array.isArray(data) ? data : []);
      } catch {
        // ignore if endpoint not ready
      }
    }
    load();
    return () => { ignore = true; };
  }, [groupId]);

  useEffect(() => {
    if (!term.trim()) { setResults([]); return; }
    const id = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const data = await api(`/api/users/search?q=${encodeURIComponent(term.trim())}`);
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [term]);

  const addExisting = (user, role = "family") => {
    if (selected.some(s => s.kind === "user" && s.value._id === user._id)) return;
    setSelected(prev => [...prev, { kind: "user", value: user, role }]);
  };

  const addInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) { setMsg({ type: "error", text: "Enter a valid email" }); return; }
    if (selected.some(s => s.kind === "invite" && s.value === email)) return;
    setSelected(prev => [...prev, { kind: "invite", value: email, role: roleForInvite }]);
    setInviteEmail("");
  };

  const removeSelected = (idx) => {
    setSelected(prev => prev.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      // existing users
      for (const s of selected.filter(x => x.kind === "user")) {
        await api("/api/memberships", {
          method: "POST",
          body: JSON.stringify({ groupId, userId: s.value._id, role: s.role }),
        });
      }
      // invitations
      for (const s of selected.filter(x => x.kind === "invite")) {
        await api("/api/invitations", {
          method: "POST",
          body: JSON.stringify({ groupId, email: s.value, role: s.role }),
        });
      }
      setSelected([]);
      setMsg({ type: "success", text: "Members added" });

      // refresh members
      try {
        const data = await api(`/api/memberships/group/${groupId}`);
        setMembers(Array.isArray(data) ? data : []);
      } catch {}
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not add members" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <div className="container-n">
        <header className="text-center mb-8">
          <h1 className="section-title">Add Members</h1>
          <p className="section-sub">
            {group?.groupName ? `Add people to ${group.groupName}` : "Search existing users or invite by email"}
          </p>
        </header>

        <div className="card mx-auto max-w-3xl">
          <div className="card-pad">
            {/* Search */}
            <div className="field">
              <div className={`floater ${term ? "filled" : ""}`}>
                <label className="float-label">Search by name or email</label>
                <input
                  className="input"
                  placeholder=" "
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />
              </div>
              <p className="help">Start typing to search existing users</p>
            </div>

            {/* Results */}
            <div className="field">
              {loadingSearch && <div className="skeleton" style={{ height: 12, width: "40%" }} />}
              {!loadingSearch && term && results.length === 0 && (
                <div className="help">No users found. Invite by email below.</div>
              )}
              {!loadingSearch && results.length > 0 && (
                <ul className="space-y-3">
                  {results.map((u) => (
                    <li key={u._id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                          {u.firstName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-ghost" onClick={() => addExisting(u, "family")}>Add as Family</button>
                        <button className="btn-primary" onClick={() => addExisting(u, "caregiver")}>Add as Caregiver</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Invite by email */}
            <div className="field">
              <div className="grid gap-3 sm:grid-cols-[1fr,10rem,9rem]">
                <div className={`floater ${inviteEmail ? "filled" : ""}`}>
                  <label className="float-label">Invite by email</label>
                  <input
                    className="input"
                    placeholder=" "
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <select
                  className="input"
                  value={roleForInvite}
                  onChange={(e) => setRoleForInvite(e.target.value)}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                <button type="button" className="btn-primary" onClick={addInvite}>
                  Add invite
                </button>
              </div>
              <p className="help">We will email an invite with a sign in link</p>
            </div>

            {/* Pending additions */}
            {selected.length > 0 && (
              <div className="field">
                <div className="card-sub font-semibold mb-2">Pending additions</div>
                <div className="flex flex-wrap gap-2">
                  {selected.map((s, i) => (
                    <span
                      key={`${s.kind}-${i}`}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                      {s.kind === "user"
                        ? `${s.value.firstName} ${s.value.lastName}`
                        : s.value}
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                        {s.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSelected(i)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Remove"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="btn-primary" disabled={saving} onClick={saveAll}>
                    {saving ? "Saving…" : "Save all"}
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {msg.type === "success" && <div className="alert-success">{msg.text}</div>}
            {msg.type === "error" && <div className="alert-error">{msg.text}</div>}

            {/* Existing members */}
            {members.length > 0 && (
              <div className="field">
                <div className="card-sub font-semibold mb-2">Current members</div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {members.map((m) => (
                    <li key={m._id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                          {m?.userId?.firstName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {m?.userId?.firstName} {m?.userId?.lastName}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{m?.userId?.email}</div>
                        </div>
                        <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                          {m.role}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer actions */}
            <div className="mt-6 flex items-center justify-between">
              <button className="btn-ghost" type="button" onClick={() => navigate(-1)}>
                Back
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={() => navigate(`/groups/${groupId}`)}
              >
                Finish
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          You can return to add more members any time
        </p>
      </div>
    </main>
  );
}
