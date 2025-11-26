import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskList from "../components/tasks/TaskList.jsx";
import TaskFilters from "../components/tasks/TaskFilters.jsx";

export default function Tasks() {
  const [tasksByGroup, setTasksByGroup] = useState({});
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  // Fetch tasks grouped by groupId
  const fetchTasks = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/tasks?userId=${userId}`
      );
      const data = await response.json();
      setTasksByGroup(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Mark task complete
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

  // Filter tasks within a group
  const filterTasks = (tasks) => {
    return tasks.filter((t) => {
      if (filter === "completed") return t.status === "completed";
      if (filter === "today")
        return (
          t.dueAt?.split("T")[0] === new Date().toISOString().split("T")[0]
        );
      return true;
    });
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

        <TaskFilters filter={filter} setFilter={setFilter} />

        {Object.keys(tasksByGroup).length === 0 && <p>No tasks found.</p>}

        {Object.entries(tasksByGroup).map(([groupId, groupData]) => {
          const filtered = filterTasks(groupData.tasks);

          return (
            <div key={groupId} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">
                {groupData.groupName || "Unknown Group"}
              </h3>

              {filtered.length > 0 ? (
                <TaskList
                  tasks={filtered}
                  onComplete={markComplete}
                  onView={(t) => navigate(`/tasks/${t._id}`)}
                  onEdit={(id) => navigate(`/tasks/${id}/edit`)}
                />
              ) : (
                <p className="text-slate-500 text-sm">
                  No tasks in this group for the selected filter.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
