import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EditTask() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const navigate = useNavigate();

  const fetchTask = async () => {
    const response = await fetch(`/api/tasks/${id}`);
    const data = await response.json();
    setTask(data);
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    navigate("/tasks");
  };

  if (!task) return null;

  return (
    <main className="page">
      <div className="container-n">
        <div className="card">
          <div className="card-pad">
            <h2 className="section-title mb-4">Edit Task</h2>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <input
                className="input"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
              />

              <textarea
                className="input h-24"
                value={task.description}
                onChange={(e) =>
                  setTask({ ...task, description: e.target.value })
                }
              />

              <select
                className="input"
                value={task.priority}
                onChange={(e) => setTask({ ...task, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              <input
                className="input"
                type="date"
                value={task.dueDate}
                onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              />

              <div className="flex justify-end">
                <button className="btn-primary" type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
