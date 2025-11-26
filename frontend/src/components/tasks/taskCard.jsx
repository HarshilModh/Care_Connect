import { FaCalendarAlt } from "react-icons/fa";

export default function TaskCard({ task, onComplete, onView, onEdit }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  return (
    <div
      className="card w-full p-4 cursor-pointer"
      onClick={() => onView(task)}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">{task.title}</h3>

        {task.priority && (
          <span
            className={`px-2 py-1 text-xs rounded ${
              task.priority === "high"
                ? "bg-red-100 text-red-600"
                : task.priority === "medium"
                ? "bg-yellow-100 text-yellow-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {task.priority}
          </span>
        )}
      </div>

      <p className="text-slate-600 mt-2 text-sm">{task.description}</p>

      <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <FaCalendarAlt />
          <span>
            {task.dueAt
              ? new Date(task.dueAt).toLocaleDateString()
              : "No due date"}
          </span>
        </div>

        <div className="flex gap-2">
          {/* Mark Done Button */}
          <button
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task._id);
            }}
          >
            {task.status === "completed" ? "Completed" : "Mark Done"}
          </button>

          {/* Edit Task Button (same style) */}
          {task.createdBy === userId && onEdit && (
            <button
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task._id);
              }}
            >
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
