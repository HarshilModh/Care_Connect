import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  validateTaskTitle,
  validateDescription,
  validateFutureDate,
  validateRequired,
} from "../utils/validation";

export default function CreateTask() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [members, setMembers] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [type, setType] = useState("task");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  let storedUser = localStorage.getItem("user");
  let userId = "";
  try {
    userId = storedUser ? JSON.parse(storedUser)._id : "";
  } catch (err) {
    console.error("Invalid user data in localStorage", err);
  }

  useEffect(() => {
    if (!userId) return;
    async function fetchGroups() {
      const adminGroups = [];
      try {
        const res = await fetch(
          `http://localhost:3000/api/family-groups/user/${userId}`
        );
        const data = await res.json();
        console.log("Fetched groups:", data);
        for (const item of data) {
          if (item.createdBy._id === userId) {
            adminGroups.push(item);
          }
        }
        setGroups(adminGroups);
      } catch (err) {
        console.error("Error fetching groups:", err);
        toast.error("Failed to fetch groups.");
      }
    }
    fetchGroups();
  }, [userId]);

  useEffect(() => {
    if (!selectedGroup) return;

    async function fetchMembers() {
      const members = [];
      try {
        const res = await fetch(
          `http://localhost:3000/api/memberships/group/${selectedGroup}`
        );
        const data = await res.json();
        for (const item of data) {
          members.push({
            id: item.userId._id,
            name: item.userId.firstName + " " + item.userId.lastName,
          });
        }
        setMembers(members);
      } catch (err) {
        console.error("Error fetching members:", err);
        toast.error("Failed to fetch members.");
      }
    }

    fetchMembers();
  }, [selectedGroup]);

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setDueDate("");
    setSelectedGroup("");
    setRecipient("");
    setType("task");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate task title
    const titleError = validateTaskTitle(title);
    if (titleError) {
      toast.error(titleError);
      return;
    }

    // Validate description
    const descError = validateDescription(desc, 2000, true);
    if (descError) {
      toast.error(descError);
      return;
    }

    // Validate due date if provided
    if (dueDate) {
      const dateError = validateFutureDate(dueDate, "Due date");
      if (dateError) {
        toast.error(dateError);
        return;
      }
    }

    // Validate required fields
    const groupError = validateRequired(selectedGroup, "Family Group");
    if (groupError) {
      toast.error(groupError);
      return;
    }

    const recipientError = validateRequired(recipient, "Care Recipient");
    if (recipientError) {
      toast.error(recipientError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup,
          assignedTo: recipient,
          recipientId: recipient,
          createdBy: userId,
          title,
          description: desc,
          dueAt: dueDate || undefined,
          type,
        }),
      });
      console.log("Create task response:", res);
      if (!res.ok) {
        throw new Error("Failed to create task");
      }
      toast.success("Task created successfully!");
      resetForm();
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      toast.error("Error creating task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="container-n">
        <header className="text-center mb-8">
          <h1 className="section-title">Create Task</h1>
          <p className="section-sub">
            Assign tasks to your family group members.
          </p>
        </header>

        <div className="card mx-auto max-w-2xl">
          <form className="card-pad form-grid" onSubmit={handleSubmit}>
            <div className={`floater ${title ? "filled" : ""}`}>
              <label className="float-label">Task Title</label>
              <input
                className="input"
                placeholder=" "
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className={`floater ${desc ? "filled" : ""}`}>
              <label className="float-label">Description</label>
              <textarea
                className="textarea"
                placeholder=" "
                rows={4}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                required
              />
            </div>

            <div className={`floater ${selectedGroup ? "filled" : ""}`}>
              <label className="float-label"></label>
              <select
                className="input"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                required
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.groupName || g._id}
                  </option>
                ))}
              </select>
            </div>

            <div className={`floater ${recipient ? "filled" : ""}`}>
              <label className="float-label"></label>
              <select
                className="input"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                disabled={!members.length}
              >
                <option value="">Select Recipient</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`floater ${type ? "filled" : ""}`}>
              <label className="float-label">Task Type</label>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="task">Task</option>
                <option value="medication">Medication</option>
                <option value="event">Event</option>
                <option value="note">Note</option>
              </select>
            </div>

            <div className={`floater ${dueDate ? "filled" : ""}`}>
              <label className="float-label"></label>
              <input
                className="input"
                type="date"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onKeyDown={(e) => e.preventDefault()}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                className="btn-ghost"
                onClick={resetForm}
                disabled={loading}
              >
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Creating…" : "Create Task"}
              </button>
            </div>
          </form>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </main>
  );
}
