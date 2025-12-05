import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  validateTaskTitle,
  validateDescription,
  validateFutureDate,
} from "../../utils/validation";

export default function EditTaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  members,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [type, setType] = useState("task");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueAt(task.dueAt?.substring(0, 10) || "");
      setType(task.type || "task");
      setRecipient(task.recipient || "");
    }
  }, [task]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Edit Task</h2>

        {/* Title */}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title
        </label>
        <input
          className="w-full border rounded p-2 mb-4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Description */}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows="3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>

        {/* Type */}
        <div className={`floater ${type ? "filled" : ""}`}>
          <label className="float-label">Task Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="task">Task</option>
            <option value="medication">Medication</option>
            <option value="event">Event</option>
            <option value="note">Note</option>
          </select>
        </div>

        {/* Due Date */}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Due Date
        </label>
        <input
          type="date"
          className="w-full border rounded p-2 mb-6"
          value={dueAt}
          min={new Date().toISOString().split("T")[0]} // disable past dates
          onKeyDown={(e) => e.preventDefault()} // disable typing
          onChange={(e) => setDueAt(e.target.value)}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn-primary"
            onClick={() => {
              // Validate title
              const titleError = validateTaskTitle(title);
              if (titleError) {
                toast.error(titleError);
                return;
              }

              // Validate description
              const descError = validateDescription(description, 2000, true);
              if (descError) {
                toast.error(descError);
                return;
              }

              // Validate due date if provided
              if (dueAt) {
                const dateError = validateFutureDate(dueAt, "Due date");
                if (dateError) {
                  toast.error(dateError);
                  return;
                }
              }

              onSave({
                ...task,
                title,
                description,
                dueAt,
                groupId: task.groupId?._id || task.groupId,
                recipientId: recipient || task.recipientId,
              });
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
