// src/pages/Tasks.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskList from "../components/tasks/taskList.jsx";
import TaskFilters from "../components/tasks/TaskFilters.jsx";
import EditTaskModal from "../components/tasks/taskEdit.jsx";
import TaskCalendar from "../components/tasks/TaskCalendar.jsx";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  const fetchTasks = async (filters = {}) => {
    if (!userId) return;

    try {
      setLoading(true);
      const query = new URLSearchParams({ userId, ...filters }).toString();
      console.log("Fetching tasks with query:", query);
      const res = await fetch(
        `http://localhost:3000/api/tasks/search?${query}`
      );
      console.log("Fetch response:", res);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markComplete = async (taskId) => {
    if (!userId) return;
    try {
      const res = await fetch(
        `http://localhost:3000/api/tasks/${taskId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedBy: userId }),
        }
      );
      if (!res.ok) throw new Error("Failed to complete task");
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Error completing task: " + err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Error deleting task: " + err.message);
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
            // ensure groupId is an id, not full object
            groupId: updatedTask.groupId?._id || updatedTask.groupId,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update task");
      await fetchTasks();
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      alert("Error updating task: " + err.message);
    }
  };

  const handleTaskEdit = (t) => {
    setTaskToEdit(t);
    setShowEditModal(true);
  };

  const handleTaskView = (t) => {
    navigate(`/tasks/${t._id}`);
  };

  return (
    <main className="page">
      <div className="container-n">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Tasks</h2>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 ${viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 border-l border-gray-200 ${viewMode === "calendar"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Calendar
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={() => navigate("/tasks/create")}
            >
              + Create Task
            </button>
          </div>
        </div>

        {/* Filters work for both views */}
        <TaskFilters
          userId={userId}
          onFilterChange={(filteredData) => setTasks(filteredData)}
        />

        {loading && <p className="mt-4">Loading tasks...</p>}
        {!loading && tasks.length === 0 && (
          <p className="mt-4">No tasks found.</p>
        )}

        {!loading && tasks.length > 0 && (
          <>
            {viewMode === "list" ? (
              // Existing list view
              <div className="mt-4 space-y-4">
                {tasks.map((task) => (
                  <TaskList
                    key={task._id}
                    tasks={[task]}
                    onComplete={markComplete}
                    onView={handleTaskView}
                    onEdit={handleTaskEdit}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            ) : (
              // New calendar view
              <div className="mt-4">
                <TaskCalendar
                  tasks={tasks}
                  onTaskClick={handleTaskView}
                  onTaskEdit={handleTaskEdit}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showEditModal && (
        <EditTaskModal
          task={taskToEdit}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={saveTaskUpdates}
        />
      )}
    </main>
  );
}