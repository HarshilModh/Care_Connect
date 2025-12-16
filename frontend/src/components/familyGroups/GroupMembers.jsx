import React, { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast,ToastContainer } from "react-toastify"
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid"
import api from "../../api/axios"

const ROLE_LABELS = {
  admin: "Admin",
  caregiver: "Caregiver",
  family: "Family",
  careRecipient: "Care Recipient",
}

const ROLE_COLORS = {
  admin: "from-indigo-600 to-purple-600",
  caregiver: "from-emerald-600 to-lime-600",
  family: "from-sky-500 to-indigo-500",
  careRecipient: "from-gray-400 to-gray-600"
}

function getMemberInfo(member) {
  const user = member.userId && typeof member.userId === 'object' ? member.userId : null;

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const fullName = user ? `${firstName} ${lastName}`.trim() : (member.userEmail || "Unknown");
  const email = user?.email || member.userEmail || "";

  const parts = fullName.split(" ").filter(Boolean);
  const initials = parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : (parts[0] ? parts[0][0].toUpperCase() : "U");

  return { fullName, email, initials };
}

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString();
}


const GroupMembers = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [removingId, setRemovingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    if (!groupId) return;

    const controller = new AbortController();

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/memberships/group/${groupId}`, { signal: controller.signal });
        console.log("Fetched members:", res.data);
        const data = Array.isArray(res.data) ? res.data : res.data?.members || [];
        setMembers(data);

        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        console.log("Current user:", currentUser);
        const isMember = data.some(m => m.userId._id === currentUser?._id);

        if (!isMember) {
          toast.error("You are not a member of this group.");
          navigate("/family-groups");
        }

      } catch (err) {
        console.error("Error fetching members:", err);
        if (err.name === 'CanceledError') return; // Ignore aborts
        setError(err.response?.data?.message || "Failed to fetch members");
        navigate("/family-groups");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
    return () => controller.abort();
  }, [groupId, navigate]);

  const filteredMembers = useMemo(() => {
    let result = members;
    const query = searchQuery.toLowerCase().trim();
    if (roleFilter) result = result.filter(m => m.role === roleFilter);
    if (statusFilter) result = result.filter(m => m.status === statusFilter);

    if (query) {
      result = result.filter(m => {
        const { fullName, email } = getMemberInfo(m);
        return fullName.toLowerCase().includes(query) || email.toLowerCase().includes(query);
      });
    }

    return result.sort((a, b) => {
      const nameA = getMemberInfo(a).fullName.toLowerCase();
      const nameB = getMemberInfo(b).fullName.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const visibleMembers = filteredMembers.slice(0);

  const handleRemove = async (member) => {
    if (member.role === "admin") {
      toast.error("Cannot remove admins.");
      console.log("Attempted to remove admin member:", member);
      return;
    }

    const { fullName } = getMemberInfo(member);
    if (!window.confirm(`Remove ${fullName} from the group?`)) return;

    setRemovingId(member._id);
    const previousMembers = [...members];

    setMembers(m => m.filter(x => x._id !== member._id));

    try {
      await api.delete(`/memberships/${member._id}`);
      toast.success("Member removed");
    } catch (err) {
      setMembers(previousMembers);
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return (
    <div className="p-6 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
      </div>
    </div>
  );
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Group Members</h2>
          <div className="text-sm text-gray-500 mt-1">{members.length} Members Total</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="careGiver">Caregiver</option>
              <option value="family">Family</option>
              <option value="careRecipient">Care Recipient</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {visibleMembers.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg text-slate-500 border border-dashed border-gray-300">
          No members found matching your filters.
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleMembers.map((member) => (
            <MemberCard
              key={member._id}
              member={member}
              onRemove={() => handleRemove(member)}
              isRemoving={removingId === member._id}
            />
          ))}
        </div>
      )}

      {filteredMembers.length > visibleMembers.length && (
        <div className="mt-6 flex justify-center">
          <button className="btn-ghost" onClick={() => setLimit(prev => prev + 12)}>
            Show more members
          </button>
        </div>
      )}

      <div className="mt-6 flex gap-3 pt-4 border-t">
        <button className="btn-ghost" onClick={() => navigate("/family-groups")}>
          &larr; Back to Groups
        </button>
        <button className="btn-primary" onClick={() => navigate("/addMember")}>
          + Add New Member
        </button>
      </div>


    </div>
  )
}


const MemberCard = ({ member, onRemove, isRemoving }) => {
  const { fullName, email, initials } = getMemberInfo(member);
  const role = member.role || "family";
  const badgeColor = ROLE_COLORS[role] || ROLE_COLORS.family;
  const status = member.status || "unknown";

  const isComplete = member.onboardingStatus === "completed";
  const isRequired = member.onboardingStatus === "required";
  const isStatusActive = status === "active";
  const isStatusPending = status === "pending";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">

      <div className="flex items-center gap-4 overflow-hidden">
        <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${badgeColor}`}>
          {initials}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-800 truncate">{fullName}</h3>
            <span className="hidden sm:inline text-xs text-slate-400">•</span>
            <span className="hidden sm:inline text-xs text-slate-400">
              {formatDate(member.joinedAt || member.createdAt)}
            </span>
          </div>
          <p className="text-sm text-slate-500 truncate">{email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-white bg-gradient-to-r ${badgeColor}`}>
            {ROLE_LABELS[role] || role}
          </span>

          <div className="flex gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${isStatusActive ? "bg-green-50 text-green-700" :
              isStatusPending ? "bg-yellow-50 text-yellow-700" :
                "bg-gray-50 text-gray-700"
              }`}>
              {status}
            </span>

            {(isComplete || isRequired) && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${isComplete ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                {isComplete ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                <span className="hidden md:inline">{isComplete ? "Onboarded" : "Onboarding"}</span>
              </span>
            )}
          </div>
        </div>

        <button
          className="btn-ghost text-slate-400 hover:text-red-600 hover:bg-red-50"
          onClick={onRemove}
          disabled={role === "owner" || role === "admin" || isRemoving}
        >
          {isRemoving ? "..." : "Remove"}
        </button>
      <ToastContainer position="top-right" autoClose={5000} />

      </div>
    </div>
  )
}



export default GroupMembers