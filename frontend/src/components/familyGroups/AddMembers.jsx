import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { auth } from "../../firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { createRandomPassword } from "../../../../backend/utils/randomGenerator.js";
import { sendJoinRequest } from "../../api/notifications";
import {
  Search,
  UserPlus,
  Users,
  Mail,
  X,
  Check,
  Loader2,
  Trash2,
  ArrowLeft,
  Shield,
  Plus,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
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
  { value: "careRecipient", label: "Care Recipient" },
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
    setSearchResults([]);
    setEmail(""); // clear search
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

    const memberships = uniques.map((u) => u.payload);

    console.log("memberships", memberships);

    try {
      setSubmitting(true);
      await axios.post(
        "http://localhost:3000/api/memberships/bulk",
        { memberships },
        { withCredentials: true }
      );
      toast.success("Members added successfully");
      setPending([]);
      setIsLoadingMembers(true);

      // Refresh members list
      try {
        const mm = await axios.get(
          `http://localhost:3000/api/memberships/group/${groupId}`,
          { withCredentials: true }
        );
        const updatedMembers = Array.isArray(mm.data)
          ? mm.data
          : mm.data?.members ?? [];
        setExistingMembers(updatedMembers);
      } catch (err) {
        console.error("Refresh error", err);
      } finally {
        setIsLoadingMembers(false);
      }

      // Send notifications
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
        if (!member.userId) continue;
        try {
          await sendJoinRequest(
            groupId,
            member.userId,
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
      console.log("Creating user in firebase");
      console.log("inviteEmail", inviteEmail);
      console.log("password", password);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inviteEmail,
        password
      );

      console.log("user added in firebase", userCredential);
      const user = userCredential.user;
      console.log("creating user in backend");
      console.log("user.uid", user.uid);
      // console.log("inviteFirstName", inviteFirstName);
      // console.log("inviteLastName", inviteLastName);
      // console.log("inviteEmail", inviteEmail);
      // console.log("inviteRole", inviteRole);

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
      console.log("creating membership in backend");
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
          return user?._id || user?.userId || user?.uid || null;
        } catch {
          return null;
        }
      })();

      const selectedGroup = groups.find((g) => g._id === groupId);
      const groupName = selectedGroup?.groupName || "the group";
      console.log("sending notification");
      await sendJoinRequest(
        groupId,
        resp.data.user._id,
        senderId,
        `You have been invited to join ${groupName}`
      );

      toast.success("Invitation sent successfully");
      console.log("sednd the join request notification");

      toast.success("Invitation sent");
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRole("familyMember");
    } catch (err) {
      console.error("Invite error", err);
      toast.error("Failed to send invite: " + err.message);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const pendingCount = pending?.length ?? 0;
  const canSubmit = groupId && pendingCount > 0 && !submitting;

  const initials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <button
                onClick={() => navigate("/family-groups")}
                className="hover:text-gray-900 flex items-center gap-1 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to groups
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-7 h-7 text-indigo-600" />
              Add Members
            </h1>
            <p className="text-gray-500 mt-1">
              Grow your care circle by adding family members and caregivers.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Select Group To Manage
            </label>
            <div className="relative">
              <select
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
                <option value="">-- Choose Group --</option>
                {groups.map((g) => (
                  <option key={g._id || g.id} value={g._id || g.id}>
                    {g.groupName}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {isLoadingGroups ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <Users className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Search & Invite */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Search existing users */}
            <div
              className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
                !groupId ? "opacity-60 grayscale-[0.5] pointer-events-none" : ""
              }`}
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-400" />
                  Find Existing Users
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Search by email to find users already registered in the
                  system.
                </p>

                <div className="mt-4 relative">
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Enter email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!groupId}
                    type="email"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {email && (
                    <button
                      onClick={() => {
                        setEmail("");
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results Area */}
              <div className="bg-gray-50/50 min-h-[100px]">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((u) => {
                      const uid = u._id || u.id;
                      const alreadyMember = isAlreadyMember(uid);
                      const inPending = pendingHas(uid);
                      const isAdded = alreadyMember || inPending;

                      return (
                        <div
                          key={uid || u.email}
                          className="p-4 hover:bg-white transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {initials(
                                u.firstName
                                  ? `${u.firstName} ${u.lastName}`
                                  : u.email
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {u.firstName
                                  ? `${u.firstName} ${u.lastName}`
                                  : u.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {u.email}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddFromSearch(u)}
                            disabled={isAdded}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              isAdded
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                {" "}
                                <Check className="w-4 h-4" />{" "}
                                {alreadyMember ? "Member" : "Pending"}{" "}
                              </>
                            ) : (
                              <>
                                {" "}
                                <Plus className="w-4 h-4" /> Add{" "}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : email && !searchLoading ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No users found matching "{email}"
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    Search results will appear here
                  </div>
                )}
              </div>
            </div>

            {/* 2. Invite New User */}
            <div
              className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${
                !groupId ? "opacity-60 grayscale-[0.5] pointer-events-none" : ""
              }`}
            >
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  Invite New User via Email
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Send an invitation to someone who isn't on the platform yet.
                </p>
              </div>

              <div className="p-6">
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Jane"
                        value={inviteFirstName}
                        onChange={(e) => setInviteFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Doe"
                        value={inviteLastName}
                        onChange={(e) => setInviteLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="jane@example.com"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Assign Role
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={inviteSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {inviteSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {inviteSubmitting
                        ? "Sending Invite..."
                        : "Send Invitation"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Pending & Existing */}
          <div className="lg:col-span-5 space-y-6">
            {/* 3. Pending List */}
            <div
              className={`bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden flex flex-col h-[500px] transition-all duration-300 ${
                !groupId ? "opacity-60 grayscale-[0.5] pointer-events-none" : ""
              }`}
            >
              <div className="p-5 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-indigo-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Pending List
                  </h2>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {pendingCount} members ready to add
                  </p>
                </div>
                <button
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-white text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  + Add Empty Row
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {pending.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-2">
                    <Users className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">
                      Add users from search or create rows manually to populate
                      this list.
                    </p>
                  </div>
                ) : (
                  pending.map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-gray-400">
                          Member {idx + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <input
                          className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Email address"
                          value={p.email}
                          onChange={(e) =>
                            handleUpdateRow(idx, { email: e.target.value })
                          }
                          disabled={!!p.userId} // Disable editing email if added from existing user
                        />
                        <select
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                <button
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {submitting
                    ? "Processing..."
                    : `Confirm & Add ${pendingCount} Members`}
                </button>
              </div>
            </div>

            {/* 4. Existing Members Reference */}
            <div
              className={`bg-white rounded-2xl border border-gray-200 p-5 ${
                !groupId ? "opacity-50" : ""
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex justify-between items-center">
                <span>Existing Members</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {existingMembers.length}
                </span>
              </h3>

              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {isLoadingMembers ? (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    Loading members...
                  </div>
                ) : existingMembers.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs italic">
                    No members yet
                  </div>
                ) : (
                  existingMembers.map((m) => (
                    <div
                      key={m._id || m.id || m.email}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {initials(
                            m.userId?.firstName
                              ? `${m.userId.firstName}`
                              : m.email
                          )}
                        </div>
                        <span className="truncate max-w-[120px]">
                          {m.userId?.firstName
                            ? `${m.userId.firstName} ${m.userId.lastName}`
                            : m.email || "Unknown"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100 capitalize">
                        {m.role === "familyMember" ? "Family" : m.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          theme="colored"
        />
      </div>
    </main>
  );
};

export default AddMembers;
