import { FaCalendarAlt } from "react-icons/fa";

export default function TaskCard({ task, onComplete, onView }) {
  return (
    <div className="card p-4 cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">{task.title}</h3>

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
      </div>

      <p className="text-slate-600 mt-2 text-sm">{task.description}</p>

      <div className="flex justify-between items-center mt-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <FaCalendarAlt />
          <span>{task.dueDate}</span>
        </div>

        <button
          className="btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task._id);
          }}
        >
          {task.completed ? "Completed" : "Mark Done"}
        </button>
      </div>
    </div>
  );
}
