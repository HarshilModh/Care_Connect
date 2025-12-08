import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import {
  Calendar,
  Users,
  User,
  CheckSquare,
  Pill,
  CalendarDays,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export default function CreateTask() {
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
  const [files, setFiles] = useState([]);

  const navigate = useNavigate();

  const taskTypes = [
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

  let storedUser = localStorage.getItem("user");
  let userId = "";
  try {
    userId = storedUser ? JSON.parse(storedUser)._id : "";
  } catch (err) {
    console.error("Invalid user data", err);
  }

  // Fetch Groups
  useEffect(() => {
    if (!userId) return;
    async function fetchGroups() {
      try {
        const res = await fetch(
          `http://localhost:3000/api/family-groups/user/${userId}`
        );
        let data = await res.json();
        data = data.filter(
          (g) =>
            g.members.some((m) => m.userId === userId) ||
            g.createdBy._id === userId
        );
        setGroups(data);
      } catch (err) {
        toast.error("Failed to fetch groups.");
      }
    }
    fetchGroups();
  }, [userId]);

  // Fetch Recipients and Members when group changes
  useEffect(() => {
    if (!selectedGroup) {
      setRecipients([]);
      setMembers([]);
      return;
    }

    async function fetchData() {
      try {
        // Recipients
        const resRecipients = await fetch(
          `http://localhost:3000/api/care-recipients/group/${selectedGroup}`
        );
        const dataRecipients = await resRecipients.json();

        const formattedRecipients = dataRecipients
          .filter((item) => item.userId)
          .map((item) => ({
            id: item.userId._id,
            name: `${item.userId.firstName} ${item.userId.lastName}`,
          }));

        setRecipients(formattedRecipients);

        // Members
        const resMembers = await fetch(
          `http://localhost:3000/api/memberships/group/${selectedGroup}`
        );
        const dataMembers = await resMembers.json();

        const formattedMembers = [];
        for (const item of dataMembers) {
          const user = item.userId;
          if (!user) continue;

          const isRecipient = formattedRecipients.some(
            (r) => r.id === user._id
          );
          if (isRecipient) continue;
          if (item.role === "admin") continue;
          if (item.onboardingStatus === "required") continue;
          if (item.status !== "active") continue;
          if (item.role === "careRecipient") continue;

          formattedMembers.push({
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
          });
        }
        setMembers(formattedMembers);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch group details.");
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
      const hasFiles = files && files.length > 0;

      let response;
      if (!hasFiles) {
        // OLD BEHAVIOR: JSON request (no files)
        response = await fetch("http://localhost:3000/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: selectedGroup,
            assignedTo: assignedTo || undefined,
            recipientId: recipient,
            createdBy: userId,
            title,
            description: desc,
            dueAt: dueDate || undefined,
            repeatRule: repeatRule || undefined,
            type,
          }),
        });
      } else {
        // NEW BEHAVIOR: multipart/form-data with files
        const formData = new FormData();
        formData.append("groupId", selectedGroup);
        formData.append("recipientId", recipient);
        formData.append("createdBy", userId);
        formData.append("title", title);
        formData.append("description", desc || "");
        if (assignedTo) formData.append("assignedTo", assignedTo);
        if (dueDate) formData.append("dueAt", dueDate);
        if (repeatRule) formData.append("repeatRule", repeatRule);
        if (type) formData.append("type", type);

        // attachments go as dataFiles -> matches req.files.dataFiles
        files.forEach((file) => {
          formData.append("dataFiles", file);
        });

        response = await fetch("http://localhost:3000/api/tasks", {
          method: "POST",
          body: formData, // do NOT set Content-Type manually
        });
      }

      if (!response.ok) throw new Error("Failed to create task");

      toast.success("Task created successfully!");
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      toast.error("Error creating task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p className="mt-2 text-gray-600">
            Coordinate care and assign responsibilities.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-xl rounded-2xl overflow-hidden"
        >
          {/* Section 1: Task Type & Basics */}
          <div className="p-6 border-b border-gray-100 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Task Category
              </label>
              <div className="grid grid-cols-4 gap-3">
                {taskTypes.map((t) => {
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
                  placeholder="e.g., Morning Medication check"
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
                  placeholder="Add details, dosage instructions, or notes..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              {/* NEW: Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments (optional)
                </label>
                <input
                  type="file"
                  multiple
                  name="dataFiles"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {files.length} file(s) selected.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Assignment Context */}
          <div className="p-6 bg-gray-50/50 space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Assignment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Group Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Group
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    required
                  >
                    <option value="">Select Group</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.groupName || "Unnamed Group"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Recipient Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Care Recipient
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={!selectedGroup}
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    required
                  >
                    <option value="">
                      {selectedGroup
                        ? "Select Recipient"
                        : "Select Group First"}
                    </option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Assign To */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-blue-600 text-xs font-bold">
                    @
                  </div>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    disabled={!selectedGroup}
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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

              {/* Due Date */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="datetime-local"
                    value={dueDate}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setDueDate(e.target.value)}
                    onKeyDown={(e) => e.preventDefault()}
                    className="w-full pl-10 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Repeat Rule */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat
                </label>
                <div className="relative">
                  <select
                    value={repeatRule}
                    onChange={(e) => setRepeatRule(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="px-6 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/30"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>

        <ToastContainer
          position="bottom-right"
          theme="colored"
          autoClose={3000}
        />
      </div>
    </main>
  );
}
