import TaskCard from "./TaskCard.jsx";

export default function TaskList({ tasks, onComplete, onView, onEdit }) {
  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onComplete={onComplete}
          onView={onView}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
