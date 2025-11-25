import TaskCard from "./TaskCard";

export default function TaskList({ tasks, onComplete, onView }) {
  if (tasks.length === 0)
    return (
      <div className="text-center text-slate-500 mt-6">
        No tasks to display.
      </div>
    );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onComplete={onComplete}
          onView={onView}
        />
      ))}
    </div>
  );
}
