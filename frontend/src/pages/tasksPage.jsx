import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskList from "../components/tasks/taskList.jsx";
import TaskFilters from "../components/tasks/TaskFilters.jsx";
import EditTaskModal from "../components/tasks/taskEdit.jsx";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  const fetchTasks = async (filters = {}) => {
    if (!userId) return;

    try {
      setLoading(true);
      const query = new URLSearchParams({ userId, ...filters }).toString();
      const res = await fetch(
        `http://localhost:3000/api/tasks/search?${query}`
      );
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

  return (
    <main className="page">
      <div className="container-n">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Tasks</h2>
          <button
            className="btn-primary"
            onClick={() => navigate("/tasks/create")}
          >
            + Create Task
          </button>
        </div>

        <TaskFilters
          userId={userId}
          onFilterChange={(filteredData) => setTasks(filteredData)}
        />

        {loading && <p>Loading tasks...</p>}
        {!loading && tasks.length === 0 && <p>No tasks found.</p>}

        {!loading &&
          tasks.map((task) => (
            <TaskList
              key={task._id}
              tasks={[task]}
              onComplete={markComplete}
              onView={(t) => navigate(`/tasks/${t._id}`)}
              onEdit={(t) => {
                setTaskToEdit(t);
                setShowEditModal(true);
              }}
              onDelete={deleteTask}
            />
          ))}
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
