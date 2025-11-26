export default function TaskFilters({ filter, setFilter }) {
  const buttons = [
    { label: "All", value: "all" },
    { label: "Due Today", value: "today" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <div className="flex gap-3 mb-6">
      {buttons.map((btn) => (
        <button
          key={btn.value}
          className={`px-4 py-2 rounded-lg text-sm border 
            ${
              filter === btn.value
                ? "bg-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          onClick={() => setFilter(btn.value)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
