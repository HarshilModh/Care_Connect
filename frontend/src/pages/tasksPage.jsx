import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Calendar,
  Pill,
  StickyNote,
  CheckSquare,
  User,
  Clock
} from "lucide-react";
import EditTaskModal from "../components/tasks/taskEdit.jsx"; // Keeping this import
import "react-toastify/dist/ReactToastify.css";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Local UI State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'completed'

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const navigate = useNavigate();

  // Safe User Access
  let userId = "";
  try {
    const storedUser = localStorage.getItem("user");
    userId = storedUser ? JSON.parse(storedUser)._id : "";
  } catch (err) {
    console.error("User parse error", err);
  }

  // Fetch Tasks
  const fetchTasks = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Fetching ALL tasks for this user initially
      const res = await fetch(`http://localhost:3000/api/tasks/search?userId=${userId}`);

      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      console.log("Fetched tasks:", data);
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter Logic (Client Side for snappiness)
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Search Filter
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'completed'
          ? task.status === 'completed'
          : task.status !== 'completed';

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  // Derived Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status !== 'completed').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  // Actions
  const markComplete = async (taskId, currentStatus) => {
    // Optimistic Update (Update UI immediately before server responds)
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      const endpoint = newStatus === 'completed' ? 'complete' : 'uncomplete'; // Assuming you might have an uncomplete endpoint, if not, adjust
      // If you only have a 'complete' endpoint that toggles or sets to complete:
      const res = await fetch(
        `http://localhost:3000/api/tasks/${taskId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedBy: userId }),
        }
      );
      if (!res.ok) throw new Error("Failed to update task");
      toast.success(newStatus === 'completed' ? "Task completed!" : "Task reopened");
    } catch (err) {
      toast.error(err.message);
      fetchTasks(); // Revert on error
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");

      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveTaskUpdates = async (updatedTask) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/tasks/${updatedTask._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updatedTask,
            groupId: updatedTask.groupId?._id || updatedTask.groupId,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update task");
      await fetchTasks();
      setShowEditModal(false);
      toast.success("Task updated successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Helper for icons based on type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'medication': return <Pill className="w-4 h-4 text-red-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'note': return <StickyNote className="w-4 h-4 text-yellow-500" />;
      default: return <CheckSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  // Helper for formatting date
  const formatDate = (dateString) => {
    if (!dateString) return "No Due Date";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Dashboard</h1>
            <p className="text-gray-500 text-sm">Manage care responsibilities</p>
          </div>
          <button
            onClick={() => navigate("/tasks/create")}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" /> Create Task
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-semibold uppercase">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-yellow-600 text-xs font-semibold uppercase">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-green-600 text-xs font-semibold uppercase">Completed</p>
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            {['all', 'pending', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {loading ? (
            // Skeleton Loading State
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white h-24 rounded-xl animate-pulse shadow-sm"></div>
            ))
          ) : filteredTasks.length === 0 ? (
            // Empty State
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No tasks found matching your filters.</p>
              <button onClick={() => { setSearch(''); setStatusFilter('all') }} className="text-blue-600 text-sm mt-2 hover:underline">Clear filters</button>
            </div>
          ) : (
            // Task Items
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`group bg-white rounded-xl p-5 border transition-all hover:shadow-md ${task.status === 'completed' ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox Button */}
                  <button
                    onClick={() => markComplete(task._id, task.status)}
                    className={`mt-1 flex-shrink-0 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-500'
                      }`}
                  >
                    {task.status === 'completed'
                      ? <CheckCircle2 className="w-6 h-6 fill-green-50" />
                      : <Circle className="w-6 h-6" />
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Type Badge */}
                      <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${task.type === 'medication' ? 'bg-red-50 text-red-600 border-red-100' :
                          task.type === 'event' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {getTypeIcon(task.type)}
                        {task.type}
                      </span>

                      {/* Date Badge */}
                      {task.dueAt && (
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${new Date(task.dueAt) < new Date() && task.status !== 'completed' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueAt).toLocaleDateString()}
                          
                        </span>
                      )}
                    </div>

                    <h3 className={`font-semibold text-lg truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}>
                      {task.title}
                    </h3>

                    <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                      {task.description || "No description provided."}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {task.recipientId && (
                        <div className="flex items-center gap-1.5" title="Recipient">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>For: {task.recipientId.firstName} {task.recipientId.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setTaskToEdit(task);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Modal Wrapper */}
        {showEditModal && (
          <EditTaskModal
            task={taskToEdit}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={saveTaskUpdates}
          />
        )}

        <ToastContainer
          position="bottom-right"
          autoClose={2000}
          hideProgressBar={true}
          theme="colored"
        />
      </div>
    </main>
  );
}