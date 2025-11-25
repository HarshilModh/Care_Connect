import { useEffect, useState } from "react";
import TaskList from "../components/tasks/taskList.jsx";
import TaskFilters from "../components/tasks/taskFilters";
import { useNavigate } from "react-router-dom";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  // Fetch tasks (replace with your API)
  const fetchTasks = async () => {
    const response = await fetch("/api/tasks");
    const data = await response.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const markComplete = async (id) => {
    await fetch(`/api/tasks/${id}/complete`, { method: "PATCH" });
    fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "completed") return t.completed;
    if (filter === "today")
      return t.dueDate === new Date().toISOString().split("T")[0];
    return true;
  });

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

        <TaskList
          tasks={filteredTasks}
          onComplete={markComplete}
          onView={(t) => navigate(`/tasks/${t._id}`)}
        />
      </div>
    </main>
  );
}
