import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios"; // Use authenticated API client
import {
  Calendar,
  Users,
  User,
  CheckSquare,
  Pill,
  CalendarDays,
  StickyNote,
  ChevronDown,
  X,
  Clock,
} from "lucide-react";

const TASK_TYPES = [
  {
    id: "task",
    label: "Task",
    icon: CheckSquare,
    color: "bg-blue-100 text-blue-600 border-blue-200",
  },
  {
    id: "medication",
    label: "Meds",
    icon: Pill,
    color: "bg-red-100 text-red-600 border-red-200",
  },
  {
    id: "event",
    label: "Event",
    icon: CalendarDays,
    color: "bg-purple-100 text-purple-600 border-purple-200",
  },
  {
    id: "note",
    label: "Note",
    icon: StickyNote,
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
  },
];

export default function EditTaskModal({ task, isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [type, setType] = useState("task");
  const [loading, setLoading] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [repeatRule, setRepeatRule] = useState("");
  const [members, setMembers] = useState([]);

  // Get userId from localStorage with useMemo just once to check the perf of this
  const userId = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser)._id : "";
    } catch (err) {
      console.error("Invalid user data", err);
      return "";
    }
  }, []);

  // 1. Initialize State from Task Prop
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDesc(task.description || "");
      // Format date for datetime-local input (local timezone)
      if (task.dueAt) {
        const date = new Date(task.dueAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setDueDate("");
      }
      setType(task.type || "task");

      const groupId = task.groupId?._id || task.groupId || "";
      setSelectedGroup(groupId);

      const recipientId = task.recipientId?._id || task.recipientId || "";
      setRecipient(recipientId);

      const assignedId = task.assignedTo?._id || task.assignedTo || "";
      // Handle populated assignedTo (object) or ID (string)
      setAssignedTo(
        task.assignedTo?.userId?._id || task.assignedTo?._id || assignedId
      );

      setRepeatRule(task.repeatRule || "");
    }
  }, [task]);

  // 2. Fetch Groups
  useEffect(() => {
    if (!userId) return;
    async function fetchGroups() {
      try {
        const res = await api.get(`/family-groups/user/${userId}`);
        let data = res.data;
        if (Array.isArray(data)) {
          data = data.filter(
            (g) =>
              g.members.some((m) => m.userId === userId) ||
              g.createdBy._id === userId
          );
          setGroups(data);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
        // toast.error("Failed to fetch groups."); // Suppress to avoid spamming toast on lag
      }
    }
    fetchGroups();
  }, [userId]);

  // 3. Fetch Recipients and Members when group changes
  useEffect(() => {
    if (!selectedGroup) {
      setRecipients([]);
      setMembers([]);
      return;
    }

    async function fetchData() {
      try {
        // Fetch recipients
        const resRecipients = await api.get(
          `/care-recipients/group/${selectedGroup}`
        );
        const dataRecipients = resRecipients.data;

        const validRecipients = [];
        const recipientUserIdSet = new Set();

        if (!dataRecipients.error && Array.isArray(dataRecipients)) {
          dataRecipients.forEach((item) => {
            if (item.userId) {
              validRecipients.push({
                id: item.userId._id,
                name: `${item.userId.firstName} ${item.userId.lastName}`,
              });
              recipientUserIdSet.add(item.userId._id);
            }
          });
          setRecipients(validRecipients);
        } else {
          setRecipients([]);
        }

        // Fetch members
        const resMembers = await api.get(`/memberships/group/${selectedGroup}`);
        const dataMembers = resMembers.data;

        const validMembers = [];
        if (Array.isArray(dataMembers)) {
          for (const item of dataMembers) {
            const user = item.userId;
            if (!user) continue;
            if (recipientUserIdSet.has(user._id)) continue; // Exclude if they are a recipient

            // Exclude based on role/status
            if (item.role === "admin") continue;
            if (item.onboardingStatus === "required") continue;
            if (item.status !== "active") continue;
            if (item.role === "careRecipient") continue;

            validMembers.push({
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
            });
          }
          setMembers(validMembers);
        }
      } catch (err) {
        console.error("Error fetching context:", err);
      }
    }
    fetchData();
  }, [selectedGroup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedGroup || !recipient) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      // Convert datetime-local to ISO string to preserve timezone
      const dueAtISO = dueDate ? new Date(dueDate).toISOString() : null;

      await api.put(`/tasks/${task._id}`, {
        createdBy: userId,
        groupId: selectedGroup,
        assignedTo: assignedTo || null,
        recipientId: recipient,
        title,
        description: desc,
        dueAt: dueAtISO,
        repeatRule: repeatRule || null,
        type,
      });

      toast.success("Task updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        "Error updating task: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Modal JSX

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
            <p className="text-sm text-gray-500">Update task details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Task category */}
        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Task Category
            </label>
            <div className="grid grid-cols-4 gap-3">
              {TASK_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? `${t.color} ring-2 ring-offset-1 ring-blue-500`
                        : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-1 ${
                        isSelected ? "scale-110" : ""
                      }`}
                    />
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Details..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Assignment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Family Group
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none"
                  >
                    <option value="">Select Group</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.groupName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Care Recipient
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={!selectedGroup}
                    className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 bg-white disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none"
                  >
                    <option value="">Select Recipient</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assign To
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold">
                    @
                  </div>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    disabled={!selectedGroup}
                    className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-300 bg-white disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Repeat
                </label>
                <div className="relative">
                  <select
                    value={repeatRule}
                    onChange={(e) => setRepeatRule(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none"
                  >
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="relative pt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
