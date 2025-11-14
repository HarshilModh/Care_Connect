import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { auth } from "../../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { createRandomPassword } from "../../../../backend/utils/randomGenerator.js";
/**
 AddMembers.jsx
 Improved UI + UX for adding members to a group.
 - Debounced email search with cancel
 - Shows existing members for selected group
 - Prevent duplicates and simple validation
 - Bulk submit to POST /api/memberships/bulk
 - Invite form kept below
*/

const ROLE_OPTIONS = [
  { value: "caregiver", label: "Caregiver" },
  { value: "family", label: "Family" },
  { value: "careRecipient", label: "Care recipient" },
];

const AddMembers = () => {
  const navigate = useNavigate();

  // core lists
  const [groups, setGroups] = useState([]);
  const [existingMembers, setExistingMembers] = useState([]);

  // selected group
  const [groupId, setGroupId] = useState("");

  // search
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // pending additions
  const [pending, setPending] = useState([]); // items: { groupId, userId, email, role, status }

  // submission states
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState("family");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // load groups created by current user (from localStorage) once
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const userRaw = localStorage.getItem("user");
        if (!userRaw) return;
        const user = JSON.parse(userRaw);
        if (!user?._id) return;

        setIsLoadingGroups(true);
        const res = await axios.get(
          `http://localhost:3000/api/family-groups/creator/${user._id}`,
          { withCredentials: true }
        );
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed loading groups", err);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // when group changes, fetch existing memberships for that group
  useEffect(() => {
    if (!groupId) {
      setExistingMembers([]);
      return;
    }

    let canceled = false;
    const ctrl = new AbortController();

    const fetchMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const res = await axios.get(
          `http://localhost:3000/api/memberships/group/${groupId}`,
          { withCredentials: true, signal: ctrl.signal }
        );
        if (canceled) return;
        const payload = Array.isArray(res.data)
          ? res.data
          : res.data?.members ?? [];
        setExistingMembers(payload);
      } catch (err) {
        if (axios.isCancel?.(err)) return;
        console.error("Error fetching members", err);
        setExistingMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();

    return () => {
      canceled = true;
      ctrl.abort();
    };
  }, [groupId]);

  // debounced search effect
  useEffect(() => {
    if (!email || !groupId) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    let mounted = true;
    setSearchLoading(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/users/search/${encodeURIComponent(email)}`,
          {
            withCredentials: true,
            signal: controller.signal,
          }
        );
        if (!mounted) return;
        // allow either array or { users: [...] } shapes
        const payload = Array.isArray(res.data)
          ? res.data
          : res.data?.users ?? res.data ?? [];
        setSearchResults(payload);
      } catch (err) {
        if (axios.isCancel?.(err)) return;
        console.error("Search error", err);
        setSearchError(
          err?.response?.data?.message ?? err.message ?? "Search failed"
        );
        setSearchResults([]);
      } finally {
        if (mounted) setSearchLoading(false);
      }
    }, 400); // 400ms debounce

    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [email, groupId]);

  // helper: check if a user is already in existingMembers
  const isAlreadyMember = (userIdOrEmail) => {
    if (!existingMembers?.length) return false;
    return existingMembers.some((m) => {
      const uid =
        typeof m.userId === "object" ? m.userId._id ?? m.userId.id : m.userId;
      return (
        uid === userIdOrEmail ||
        m.userId?.email === userIdOrEmail ||
        m.email === userIdOrEmail
      );
    });
  };

  // helper: check duplicate in pending
  const pendingHas = (userIdOrEmail) => {
    return pending.some(
      (p) => p.userId === userIdOrEmail || p.email === userIdOrEmail
    );
  };

  // add search result to pending with validation
  const handleAddFromSearch = (user) => {
    if (!groupId) {
      toast.error("Select a group first");
      return;
    }

    const uid = user._id || user.id;
    const emailVal = user.email;

    if (isAlreadyMember(uid) || isAlreadyMember(emailVal)) {
      toast.error("User is already a member of this group");
      return;
    }
    if (pendingHas(uid) || pendingHas(emailVal)) {
      toast.error("User already in pending list");
      return;
    }

    const newRow = {
      groupId,
      userId: uid,
      email: emailVal,
      role: "family",
      status: "pending",
    };
    setPending((p) => [...p, newRow]);
    toast.success("Added to pending list");
  };

  // add a manual empty row
  const handleAddRow = () => {
    if (!groupId) {
      toast.error("Select a group first");
      return;
    }
    setPending((p) => [
      ...p,
      { groupId, userId: "", email: "", role: "family", status: "pending" },
    ]);
  };

  // remove row
  const handleRemoveRow = (index) => {
    setPending((p) => p.filter((_, i) => i !== index));
  };

  // set field for pending row
  const handleUpdateRow = (index, patch) => {
    setPending((rows) => {
      const copy = [...rows];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  // prepare payload and submit
  const handleSubmit = async () => {
    if (!groupId) {
      toast.error("Select a group first");
      return;
    }
    if (pending.length === 0) {
      toast.error("No pending members to submit");
      return;
    }

    // basic validation: each row must have either userId or valid email and a role
    const invalid = pending.find((r) => !(r.userId || r.email) || !r.role);
    if (invalid) {
      toast.error("Every pending row must have an email or user and a role");
      return;
    }

    // avoid duplicates in payload
    const uniques = [];
    for (const r of pending) {
      const key = r.userId || r.email;
      if (!uniques.some((u) => u.key === key)) {
        uniques.push({
          key,
          payload: {
            groupId: r.groupId,
            userId: r.userId || null,
            email: r.email || null,
            role: r.role,
            status: "pending",
          },
        });
      }
    }

    const memberships = uniques.map((u) => u.payload);

    try {
      setSubmitting(true);
      const res = await axios.post(
        "http://localhost:3000/api/memberships/bulk",
        { memberships },
        { withCredentials: true }
      );
      toast.success("Members added");
      // optimistic update: refresh existing members
      setPending([]);
      // refetch members for that group
      setIsLoadingMembers(true);
      try {
        const mm = await axios.get(
          `http://localhost:3000/api/memberships/group/${groupId}`,
          { withCredentials: true }
        );
        setExistingMembers(
          Array.isArray(mm.data) ? mm.data : mm.data?.members ?? []
        );
      } catch (err) {
        // ignore
      } finally {
        setIsLoadingMembers(false);
      }
      // navigate to family groups or stay — user preference; we'll stay and show updated list
    } catch (err) {
      console.error("Submit error", err);
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err.message ??
        "Submit failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // invite flow (placeholder: implement server invite endpoint)
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      toast.error("All fields are required");
      return;
    }
    if (!inviteEmail) {
      toast.error("Invite email required");
      return;
    }
    const password = createRandomPassword();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      inviteEmail,
      password
    );
    setInviteSubmitting(true);
    const user = userCredential.user;
    try {
      const payload = {
        firstName: inviteFirstName,
        lastName: inviteLastName,
        email: inviteEmail,
        password: password,
        confirmPassword: password,
        phone: null,
        role: inviteRole,
        needPasswordReset: true,
        uid: user.uid,
      };
      try {
        const resp = await axios.post(
          "http://localhost:3000/api/users/signUp",
          payload
        );
        const membershipPayload = {
          groupId,
          userId: resp.data.user._id,
          role: inviteRole,
          status: "pending",
        };
        await axios.post(
          "http://localhost:3000/api/memberships/",
          { memberships: [membershipPayload] },
          { withCredentials: true }
        );
      } catch (error) {
        console.error("User creation error", error);
      }
      console.log("Invite payload", {
        inviteEmail,
        inviteFirstName,
        inviteLastName,
        inviteRole,
      });
      toast.success("Invitation sent (demo)");
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRole("family");
    } catch (err) {
      console.error("Invite error", err);
      toast.error("Failed to send invite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  // derived UI helpers
  const existingCount = existingMembers?.length ?? 0;
  const pendingCount = pending?.length ?? 0;

  const canSubmit = groupId && pendingCount > 0 && !submitting;

  return (
    <main className="page">
      <div className="container-n">
        <header className="text-center mb-6">
          <h2 className="section-title">Add members</h2>
          <p className="section-sub">
            Choose a group, search by email, add results to a pending list and
            submit in bulk
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {/* left column: group select and search */}
          <div>
            <div className="card mb-4">
              <div className="card-pad">
                <label className="card-sub font-semibold">Select group</label>
                <div className="mt-2 flex items-center gap-3">
                  <select
                    className="input"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                  >
                    <option value="">-- choose group --</option>
                    {groups.map((g) => (
                      <option key={g._id || g.id} value={g._id || g.id}>
                        {g.groupName}
                      </option>
                    ))}
                  </select>

                  <div className="text-sm text-slate-500">
                    {isLoadingGroups
                      ? "loading..."
                      : `${groups.length || 0} group(s)`}
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-pad">
                <label className="card-sub font-semibold">
                  Search existing users
                </label>
                <div className="mt-3">
                  <div className="flex gap-3">
                    <input
                      className="input"
                      placeholder="Email to search (requires group selection)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!groupId}
                      type="email"
                    />
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        setEmail("");
                        setSearchResults([]);
                      }}
                    >
                      Clear
                    </button>
                  </div>

                  <div className="mt-3">
                    {searchLoading ? (
                      <div className="text-sm text-slate-500">Searching…</div>
                    ) : searchError ? (
                      <div className="alert-error">{searchError}</div>
                    ) : searchResults?.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((u) => {
                          const uid = u._id || u.id;
                          const already =
                            isAlreadyMember(uid) || pendingHas(uid);
                          return (
                            <div
                              key={uid || u.email}
                              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100"
                            >
                              <div>
                                <div className="font-medium">
                                  {u.displayName ||
                                    `${u.firstName || ""} ${
                                      u.lastName || ""
                                    }`.trim() ||
                                    u.email}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {u.email}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  className="input"
                                  value={
                                    pending.find((p) => p.userId === uid)
                                      ?.role ?? "family"
                                  }
                                  onChange={(e) => {
                                    // if already pending, update; else create temporary pending preview (not saved)
                                    const idx = pending.findIndex(
                                      (p) => p.userId === uid
                                    );
                                    if (idx >= 0) {
                                      handleUpdateRow(idx, {
                                        role: e.target.value,
                                      });
                                    } else {
                                      // add as pending with chosen role
                                      setPending((p) => [
                                        ...p,
                                        {
                                          groupId,
                                          userId: uid,
                                          email: u.email,
                                          role: e.target.value,
                                          status: "pending",
                                        },
                                      ]);
                                    }
                                  }}
                                >
                                  {ROLE_OPTIONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  className="btn-primary"
                                  type="button"
                                  onClick={() => handleAddFromSearch(u)}
                                  disabled={already}
                                >
                                  {already ? "Added" : "Add"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : email ? (
                      <div className="text-sm text-slate-500">
                        No users found
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">
                        Type an email to search existing users
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Invite card */}
            <div className="card">
              <div className="card-pad">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="card-title">Invite a new user</div>
                    <div className="card-sub">
                      Send an email invite when user not registered
                    </div>
                  </div>
                </div>

                <form onSubmit={handleInviteSubmit} className="grid gap-3">
                  <input
                    className="input"
                    placeholder="Email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      className="input"
                      placeholder="First name"
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Last name"
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                    />
                  </div>

                  <select
                    className="input"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-end gap-3">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={inviteSubmitting}
                    >
                      {inviteSubmitting ? "Sending…" : "Send invite"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* right column: pending list and existing members */}
          <div>
            <div className="card mb-4">
              <div className="card-pad">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="card-title">Pending additions</div>
                    <div className="card-sub">{pendingCount} row(s)</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => setPending([])}
                      disabled={pendingCount === 0}
                    >
                      Clear
                    </button>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={handleAddRow}
                    >
                      Add row
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {pendingCount === 0 ? (
                    <div className="text-sm text-slate-500">
                      No pending members. Add from search or create a row
                    </div>
                  ) : (
                    pending.map((row, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border border-slate-100"
                      >
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-3">
                            <input
                              className="input"
                              placeholder="Email (optional if existing user)"
                              value={row.email || ""}
                              onChange={(e) =>
                                handleUpdateRow(idx, { email: e.target.value })
                              }
                              style={{ minWidth: 180 }}
                            />

                            <input
                              className="input"
                              placeholder="User id (optional)"
                              value={row.userId || ""}
                              onChange={(e) =>
                                handleUpdateRow(idx, { userId: e.target.value })
                              }
                              style={{ minWidth: 120 }}
                            />

                            <select
                              className="input"
                              value={row.role}
                              onChange={(e) =>
                                handleUpdateRow(idx, { role: e.target.value })
                              }
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-2 text-sm text-slate-500">
                            Group:{" "}
                            <span className="font-medium">
                              {groups.find(
                                (g) => (g._id || g.id) === row.groupId
                              )?.groupName || "none"}
                            </span>
                            {row.userId && (
                              <span className="ml-3">
                                User id:{" "}
                                <code className="text-xs">{row.userId}</code>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="btn-ghost"
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Existing members:{" "}
                    {isLoadingMembers ? "loading..." : existingCount}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="btn-primary"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                    >
                      {submitting ? "Submitting…" : "Submit all"}
                    </button>
                  </div>
                </div>

                {submitting && (
                  <div className="mt-3 text-sm text-slate-500">
                    Submitting memberships...
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-pad">
                <div className="card-title">Group members</div>
                <div className="card-sub mb-3">
                  Shows existing members for the selected group
                </div>

                {groupId ? (
                  isLoadingMembers ? (
                    <div className="text-sm text-slate-500">
                      Loading members…
                    </div>
                  ) : existingMembers.length === 0 ? (
                    <div className="text-sm text-slate-500">No members yet</div>
                  ) : (
                    <ul className="space-y-2">
                      {existingMembers.map((m) => {
                        const user =
                          typeof m.userId === "object" ? m.userId : null;
                        const name = user
                          ? `${user.firstName ?? ""} ${
                              user.lastName ?? ""
                            }`.trim()
                          : m.userEmail || "Unknown";
                        const emailVal = user?.email ?? m.userEmail ?? "";
                        return (
                          <li
                            key={m._id || `${m.groupId}_${m.userId}`}
                            className="flex items-center justify-between gap-3 p-2 rounded border border-slate-100"
                          >
                            <div>
                              <div className="font-medium">{name}</div>
                              <div className="text-sm text-slate-500">
                                {emailVal}
                              </div>
                            </div>
                            <div className="text-sm text-slate-500">
                              {m.role}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )
                ) : (
                  <div className="text-sm text-slate-400">
                    Select a group to view members
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* toast container */}
        <ToastContainer position="top-right" autoClose={4000} />
      </div>
    </main>
  );
};

export default AddMembers;
