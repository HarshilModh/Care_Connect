import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { auth } from "../../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
import { createRandomPassword } from "../../../../backend/utils/randomGenerator.js";
import { sendJoinRequest } from "../../api/notifications";
import { validateEmail, validateRequired } from "../../utils/validation";

/**
 AddMembers.jsx
 Improved UI + UX for adding members to a group.
 - Debounced email search with cancel
 - Shows existing members for selected group
 - Prevent duplicates and simple validation
 - Bulk submit to POST /api/memberships/bulk
 - Invite form disabled until a group is selected
*/

const ROLE_OPTIONS = [
  { value: "careGiver", label: "Care Giver" },
  { value: "familyMember", label: "Family Member" },
  { value: "careRecipient", label: "Care recipient" },
];

const AddMembers = () => {
  // const navigate = useNavigate();

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
  const [inviteRole, setInviteRole] = useState("familyMember");
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
      role: "familyMember",
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
      {
        groupId,
        userId: "",
        email: "",
        role: "familyMember",
        status: "pending",
      },
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
    // Validate group selection
    const groupError = validateRequired(groupId, "Group");
    if (groupError) {
      toast.error(groupError);
      return;
    }

    if (pending.length === 0) {
      toast.error("No pending members to submit");
      return;
    }
    console.log("pending", pending);

    // Validate each pending member
    for (const r of pending) {
      if (r.email) {
        const emailError = validateEmail(r.email);
        if (emailError) {
          toast.error(`Invalid email: ${r.email}`);
          return;
        }
      }
      if (!r.userId && !r.email) {
        toast.error("Every pending row must have an email or user");
        return;
      }
      if (!r.role) {
        toast.error("Every pending row must have a role");
        return;
      }
    }

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

    console.log("uniques", uniques);

    const memberships = uniques.map((u) => u.payload);

    console.log("memberships", memberships);

    try {
      setSubmitting(true);
      await axios.post(
        "http://localhost:3000/api/memberships/bulk",
        { memberships },
        { withCredentials: true }
      );
      toast.success("Members added");
      setPending([]);
      setIsLoadingMembers(true);
      let updatedMembers = [];
      try {
        const mm = await axios.get(
          `http://localhost:3000/api/memberships/group/${groupId}`,
          { withCredentials: true }
        );
        updatedMembers = Array.isArray(mm.data)
          ? mm.data
          : mm.data?.members ?? [];
        setExistingMembers(updatedMembers);
      } catch (err) {
        // ignore
        console.log("err", err);
      } finally {
        setIsLoadingMembers(false);
      }

      // Send notifications to each new member
      const senderId = (() => {
        const userRaw = localStorage.getItem("user");
        if (!userRaw) return null;
        try {
          const user = JSON.parse(userRaw);
          return user?._id || user?.userId || user?.uid || null;
        } catch {
          return null;
        }
      })();

      const selectedGroup = groups.find((g) => g._id === groupId);
      const groupName = selectedGroup?.groupName || "the group";

      for (const member of memberships) {
        // only notify real users (not just email-only rows)
        if (!member.userId) continue;
        try {
          await sendJoinRequest(
            groupId,
            member.userId, // recipientId on backend
            senderId,
            `You have been invited to join ${groupName}`
          );
        } catch (notifErr) {
          console.error("Notification error for user", member.userId, notifErr);
        }
      }
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

  // invite flow
  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    const emailError = validateEmail(inviteEmail);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    // Validate first name
    const firstNameError = validateRequired(inviteFirstName, "First name");
    if (firstNameError) {
      toast.error(firstNameError);
      return;
    }

    // Validate last name
    const lastNameError = validateRequired(inviteLastName, "Last name");
    if (lastNameError) {
      toast.error(lastNameError);
      return;
    }

    const password = createRandomPassword();
    setInviteSubmitting(true);

    try {
      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inviteEmail,
        password
      );

      console.log("user added in firebase", userCredential);
      const user = userCredential.user;
      console.log("user>>>", user);
      console.log("inviteRole", inviteRole);

      // 2. Create user in backend
      const resp = await axios.post(
        "http://localhost:3000/api/users/signUp",
        {
          firstName: inviteFirstName,
          lastName: inviteLastName,
          email: inviteEmail,
          password,
          confirmPassword: password,
          phone: null,
          role: inviteRole,
          needPasswordReset: true,
          uid: user.uid,
        },
        { withCredentials: true }
      );

      console.log("user added in db", resp);
      console.log(">>>");

      // 3. Create membership (single create, not bulk)
      await axios.post(
        "http://localhost:3000/api/memberships/",
        {
          groupId,
          userId: resp.data.user._id,
          role: inviteRole,
          status: "pending",
        },
        { withCredentials: true }
      );
      console.log("user added in membership");

      // 4. Send join-request notification
      const senderId = (() => {
        const userRaw = localStorage.getItem("user");
        console.log("userRaw", userRaw);
        if (!userRaw) return null;
        try {
          const user = JSON.parse(userRaw);
          console.log("user parse", user);
          return user?._id || user?.userId || user?.uid || null;
        } catch {
          return null;
        }
      })();

      const selectedGroup = groups.find((g) => g._id === groupId);
      const groupName = selectedGroup?.groupName || "the group";

      console.log("<><>");
      console.log("groupName", groupName, groupId);
      console.log("resp.data.user._id", resp.data.user._id);

      await sendJoinRequest(
        groupId,
        resp.data.user._id, // recipientId
        senderId,
        `You have been invited to join ${groupName}`
      );

      console.log("sednd the join request notification");

      toast.success("Invitation sent");
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
                                      ?.role ?? "familyMember"
                                  }
                                  onChange={(e) => {
                                    const idx = pending.findIndex(
                                      (p) => p.userId === uid
                                    );
                                    if (idx >= 0) {
                                      handleUpdateRow(idx, {
                                        role: e.target.value,
                                      });
                                    } else {
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
                  <fieldset
                    disabled={!groupId}
                    className={!groupId ? "opacity-50" : ""}
                  >
                    {!groupId && (
                      <div className="text-sm text-slate-400 mb-2">
                        Select a group first to invite a new user
                      </div>
                    )}

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
                  </fieldset>
                </form>
              </div>
            </div>
          </div>

          {/* right column: pending list and existing members */}
          <div>
            <div className="card mb-4">
              <div className="card-pad">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Pending members</div>
                  <button className="btn-ghost" onClick={handleAddRow}>
                    + Add row
                  </button>
                </div>

                {pending.length === 0 ? (
                  <div className="text-sm text-slate-400 mt-2">
                    No pending members
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {pending.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 border rounded"
                      >
                        <input
                          className="input flex-1"
                          placeholder="Email"
                          value={p.email}
                          onChange={(e) =>
                            handleUpdateRow(idx, { email: e.target.value })
                          }
                        />
                        <select
                          className="input"
                          value={p.role}
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
                        <button
                          className="btn-danger"
                          onClick={() => handleRemoveRow(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-3">
                  <button
                    className="btn-primary"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Submitting…" : "Submit Pending"}
                  </button>
                </div>
              </div>
            </div>

            {/* existing members */}
            <div className="card">
              <div className="card-pad">
                <div className="font-semibold">
                  Existing members ({existingCount})
                </div>
                {isLoadingMembers ? (
                  <div className="text-sm text-slate-500 mt-2">Loading…</div>
                ) : existingMembers.length === 0 ? (
                  <div className="text-sm text-slate-400 mt-2">
                    No members in this group yet
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {existingMembers.map((m) => (
                      <div
                        key={m._id || m.id || m.email}
                        className="p-2 border rounded flex justify-between"
                      >
                        <div>
                          {m.userId?.firstName
                            ? `${m.userId.firstName} ${m.userId.lastName}`
                            : m.email || m.userId?.email || "Unknown"}
                        </div>
                        <div className="text-sm text-slate-500">{m.role}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </main>
  );
};

export default AddMembers;
