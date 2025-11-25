import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

/**
 GroupMembers.jsx
 - Improved visual list UI
 - client side search and filters (role and status)
 - loading skeleton, error states
 - remove member with confirmation and optimistic UI
 - safe requests with abort controller
*/

const ROLE_LABEL = {
  owner: "Owner",
  caregiver: "Caregiver",
  family: "Family",
  readonly: "Read only"
}

const ROLE_COLOR = {
  owner: "from-indigo-600 to-purple-600",
  caregiver: "from-emerald-600 to-lime-600",
  family: "from-sky-500 to-indigo-500",
  readonly: "from-gray-400 to-gray-600"
}

function formatDateIso(iso) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

function initials(name) {
  if (!name) return "U"
  const parts = name.trim().split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const GroupMembers = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  // UI filters
  const [q, setQ] = useState("") // search query: name or email
  const [roleFilter, setRoleFilter] = useState("") // empty -> all
  const [statusFilter, setStatusFilter] = useState("") // empty -> all
  const [showCount, setShowCount] = useState(12) // "load more"

  useEffect(() => {
    if (!groupId) {
      setMembers([])
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    let mounted = true

    const fetchMembers = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get(
          `http://localhost:3000/api/memberships/group/${groupId}`,
          { withCredentials: true, signal: ctrl.signal }
        )
        console.log("get group by id ", res)
        const payload = Array.isArray(res.data) ? res.data : res.data?.members ?? []
        if (!mounted) return
        setMembers(payload)
      } catch (err) {
        if (axios.isCancel?.(err)) return
        const msg = err?.response?.data?.message ?? err?.message ?? "Failed to fetch members"
        if (!mounted) return
        setError(msg)
        setMembers([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMembers()
    return () => {
      mounted = false
      ctrl.abort()
    }
  }, [groupId])

  // derived and filtered list
  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase()
    return members
      .filter((m) => {
        console.log("members m >>>", m);
        if (roleFilter && m.role !== roleFilter) return false
        if (statusFilter && m.status !== statusFilter) return false
        if (!qlc) return true
        const user = typeof m.userId === "object" ? m.userId : null
        const name = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : (m.userEmail ?? "")
        const email = user?.email ?? m.userEmail ?? ""
        return name.toLowerCase().includes(qlc) || email.toLowerCase().includes(qlc)
      })
      .sort((a, b) => {
        const ua = (typeof a.userId === "object" ? `${a.userId.firstName ?? ""} ${a.userId.lastName ?? ""}` : a.userEmail || "").toLowerCase()
        const ub = (typeof b.userId === "object" ? `${b.userId.firstName ?? ""} ${b.userId.lastName ?? ""}` : b.userEmail || "").toLowerCase()
        return ua.localeCompare(ub)
      })
  }, [members, q, roleFilter, statusFilter])

  const visible = filtered.slice(0, showCount)

  // remove member
  const handleRemove = async (membership) => {
    if (!membership || !membership._id) return
    if (membership.role === "owner") {
      toast.error("Cannot remove the owner")
      return
    }

    const confirm = window.confirm(
      `Remove ${membership.userId?.email ?? membership.userEmail ?? "this user"} from the group?`
    )
    if (!confirm) return

    const prev = members
    setMembers((m) => m.filter((x) => x._id !== membership._id))
    setRemovingId(membership._id)

    try {
      await axios.delete(`http://localhost:3000/api/memberships/${membership._id}`, { withCredentials: true })
      toast.success("Member removed")
    } catch (err) {
      setMembers(prev)
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to remove member"
      toast.error(msg)
    } finally {
      setRemovingId(null)
    }
  }

  // small helper to navigate to profile if exists
  const handleGoProfile = (membership) => {
    const user = typeof membership.userId === "object" ? membership.userId : null
    if (user?._id) navigate(`/users/${user._id}`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-gray-100 rounded-lg" />
            <div className="h-28 bg-gray-100 rounded-lg" />
            <div className="h-28 bg-gray-100 rounded-lg" />
            <div className="h-28 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error fetching members: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Group members</h2>
          <div className="text-sm text-slate-500 mt-1">{members.length} total</div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input"
            style={{ minWidth: 220 }}
          />

          <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} >
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="caregiver">Caregiver</option>
            <option value="family">Family</option>
            <option value="readonly">Read only</option>
          </select>

          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="invited">Invited</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-6 bg-white rounded shadow-sm text-center text-slate-600">
          No members match your filters
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((m) => {
            const id = m._id ?? `${m.groupId}_${m.userId?._id}`
            const user = typeof m.userId === "object" ? m.userId : null
            const name = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : (m.userEmail ?? "Unknown")
            const email = user?.email ?? (m.userEmail ?? "")
            const role = m.role ?? "family"
            const status = m.status ?? "unknown"
            const badgeColor = ROLE_COLOR[role] ?? ROLE_COLOR.family

            return (
              <div key={id} className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br ${badgeColor}`}>
                    {initials(name)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{name}</div>
                      <div className="text-xs text-slate-400">•</div>
                      <div className="text-xs text-slate-400">{formatDateIso(m.joinedAt ?? m.createdAt)}</div>
                    </div>
                    <div className="text-sm text-slate-500 truncate">{email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs font-semibold uppercase tracking-wide">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-[11px] bg-gradient-to-r ${badgeColor}`}>
                        {ROLE_LABEL[role] ?? role}
                      </span>
                    </div>

                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status === "active" ? "bg-green-50 text-green-700" : status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-700"}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost"
                      onClick={() => handleGoProfile(m)}
                      disabled={!user?._id}
                    >
                      Profile
                    </button>

                    <button
                      className="btn-ghost"
                      onClick={() => handleRemove(m)}
                      disabled={m.role === "owner" || removingId === m._id}
                    >
                      {removingId === m._id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > visible.length && (
        <div className="mt-4 flex justify-center">
          <button
            className="btn-ghost"
            onClick={() => setShowCount((s) => s + 12)}
          >
            Show more
          </button>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button className="btn-ghost" onClick={() => navigate("/family-groups")}>Back to groups</button>
        <button className="btn-primary" onClick={() => navigate("/addMember")}>Add members</button>
      </div>

      <ToastContainer position="top-right" autoClose={4000} />
    </div>
  )
}

export default GroupMembers
