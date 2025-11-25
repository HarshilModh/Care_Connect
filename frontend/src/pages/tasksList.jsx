import React, { useEffect, useState } from "react";
import { fetchGroupTasks } from "../api/tasks.api";
import TaskList from "../components/tasks/taskList";
import { useNavigate } from "react-router-dom";

export default function TasksPage() {
  const groupId = "YOUR_GROUP_ID";
  const navigate = useNavigate();

  // Hook inside the component
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await fetchGroupTasks(groupId);
      setTasks(data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (loading) return <p>Loading tasks...</p>;

  const now = new Date();
  const inDays = (days) => new Date(now.getTime() + days * 86400000);

  const tasksDue = {
    today: tasks.filter((t) => t.dueAt && new Date(t.dueAt) <= inDays(1)),
    twoDays: tasks.filter((t) => t.dueAt && new Date(t.dueAt) <= inDays(2)),
    fiveDays: tasks.filter((t) => t.dueAt && new Date(t.dueAt) <= inDays(5)),
    week: tasks.filter((t) => t.dueAt && new Date(t.dueAt) <= inDays(7)),
  };

  const pending = tasks.filter((t) => t.status === "pending");

  return (
    <div style={{ padding: "20px" }}>
      <button
        onClick={() => navigate("/create-task")}
        style={{ marginBottom: "20px" }}
      >
        Create Task
      </button>

      <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 15 }}>
        <h3>Tasks Due</h3>
        <TaskList label="Today" tasks={tasksDue.today} />
        <TaskList label="In 2 days" tasks={tasksDue.twoDays} />
        <TaskList label="In 5 days" tasks={tasksDue.fiveDays} />
        <TaskList label="This week" tasks={tasksDue.week} />
      </div>

      <div style={{ border: "1px solid #ccc", padding: 10 }}>
        <h3>Pending Tasks</h3>
        <TaskList tasks={pending} />
      </div>
    </div>
  );
}
