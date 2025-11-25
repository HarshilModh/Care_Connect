import { useState } from "react";
import { createTask } from "../../api/tasks";
import { useNavigate } from "react-router-dom";

export default function TaskForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    groupId: "",
    recipientId: "",
    createdBy: "",
    title: "",
    description: "",
    assignedTo: "",
    dueAt: "",
    timezone: "UTC",
    repeatRule: "",
    type: "task",
    notificationConfig: {},
    attachments: [],
  });

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    try {
      await createTask(form);
      navigate("/tasks");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input name="title" placeholder="Title" onChange={update} />
      <textarea
        name="description"
        placeholder="Description"
        onChange={update}
      />
      <input type="datetime-local" name="dueAt" onChange={update} />

      <button onClick={submit}>Create</button>
    </div>
  );
}
