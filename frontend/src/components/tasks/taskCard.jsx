import { FaCalendarAlt } from "react-icons/fa";

export default function TaskCard({
  task,
  onComplete,
  onView,
  onEdit,
  onDelete,
}) {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  // ----- Overdue logic -----
  let isOverdue = false;
  let dueDateFormatted = "No due date";

  if (task.dueAt) {
    const dueDate = new Date(task.dueAt);
    const today = new Date();

    // Normalize both to date-only (ignore time)
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    dueDateFormatted = dueDate.toLocaleDateString();

    if (dueDate < today && task.status !== "completed") {
      isOverdue = true;
    }
  }

  return (
    <div
      className={`card w-full p-4 relative cursor-pointer transition ${isOverdue ? "border border-red-300 bg-red-50" : ""
        }`}
      onClick={() => onView(task)}
    >
      {task.createdBy === userId && onDelete && (
        <button
          className="btn-danger absolute top-3 right-3 text-xs px-2 py-1"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to delete this task?")) {
              onDelete(task._id);
            }
          }}
        >
          ✖
        </button>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">{task.title}</h3>
        </div>

        <div className="flex items-center gap-2">
          {task.priority && (
            <span
              className={`px-2 py-1 text-xs rounded capitalize ${task.priority === "high"
                  ? "bg-red-100 text-red-600"
                  : task.priority === "medium"
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
                }`}
            >
              {task.priority}
            </span>
          )}

          {isOverdue && (
            <span className="px-2 py-1 text-xs rounded bg-red-600 text-white">
              Overdue
            </span>
          )}
        </div>
      </div>

      <p className="text-slate-600 mt-2 text-sm">{task.description}</p>

      <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <FaCalendarAlt />
          <span
            className={isOverdue ? "text-red-600 font-semibold" : ""}
          >
            {dueDateFormatted}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            className={`btn-primary ${task.status === "completed"
                ? "opacity-70 cursor-default"
                : ""
              }`}
            disabled={task.status === "completed"}
            onClick={(e) => {
              e.stopPropagation();
              if (task.status !== "completed") {
                onComplete(task._id);
              }
            }}
          >
            {task.status === "completed" ? "Completed" : "Mark Done"}
          </button>

          {task.createdBy === userId && onEdit && (
            <button
              className="btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
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