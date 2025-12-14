import { useState, useEffect } from "react";
import api from "../../api/axios";
export default function TaskFilters({ userId, onFilterChange }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchTasks = async () => {
    if (!userId) return;

    const params = new URLSearchParams({
      userId,
      query,
      status,
      type,
      priority,
      startDate,
      endDate,
    });

    try {
      // const res = await fetch(
      //   `http://localhost:3000/api/tasks/search?${params}`
      // );
      const res = await api.get(`/tasks/search?${params}`);
      const data = await res.data;
      onFilterChange(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [query, status, type, priority, startDate, endDate]);

  return (
    <div className="mb-6 space-y-2">
      <input
        type="text"
        placeholder="Search by title or description..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input w-full"
      />

      <div className="flex gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input flex-1"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input flex-1"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input flex-1"
        >
          <option value="">All Types</option>
          <option value="task">Task</option>
          <option value="medication">Medication</option>
          <option value="event">Event</option>
          <option value="note">Note</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input flex-1"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input flex-1"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
        </select>
      </div>
    </div>
  );
}
