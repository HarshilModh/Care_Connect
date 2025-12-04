// src/components/tasks/TaskCalendar.jsx
import React, { useMemo, useState } from "react";

// Helper to normalize any date-like value to "YYYY-MM-DD"
function getDateKey(dateLike) {
    if (!dateLike) return null;

    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return null;

    // toISOString is UTC; if you want local date, adjust logic accordingly
    return d.toISOString().slice(0, 10);
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper: detect if a task is completed (adjust to your schema)
function isTaskCompleted(task) {
    // tweak this based on your actual model
    if (!task) return false;
    if (task.completed === true) return true;
    if (task.isCompleted === true) return true;
    if (typeof task.status === "string" && task.status.toLowerCase() === "completed")
        return true;
    return false;
}

export default function TaskCalendar({ tasks, onTaskClick, onTaskEdit }) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    // Today as YYYY-MM-DD
    const todayKey = useMemo(() => {
        const today = new Date();
        const yyyy = today.getFullYear().toString();
        const mm = (today.getMonth() + 1).toString().padStart(2, "0");
        const dd = today.getDate().toString().padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    // Map tasks by date for quick lookup
    const tasksByDate = useMemo(() => {
        const map = {};
        for (const task of tasks || []) {
            // adjust this field if your date field is named differently
            const dateKey =
                getDateKey(task.dueDate || task.dueAt || task.date || task.createdAt);
            if (!dateKey) continue;
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(task);
        }
        return map;
    }, [tasks]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-11

    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekDay = firstDayOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build array of day cells (including blanks at start)
    const calendarCells = [];
    // Leading blanks
    for (let i = 0; i < startWeekDay; i++) {
        calendarCells.push(null);
    }
    // Real days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarCells.push(day);
    }

    const monthLabel = currentMonth.toLocaleString("default", {
        month: "long",
        year: "numeric",
    });

    const handlePrevMonth = () => {
        setCurrentMonth(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        );
    };

    const handleNextMonth = () => {
        setCurrentMonth(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
        );
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    return (
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
            {/* Calendar header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 text-sm"
                    >
                        ◀
                    </button>
                    <button
                        type="button"
                        onClick={handleToday}
                        className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-100 text-sm"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 text-sm"
                    >
                        ▶
                    </button>
                </div>

                <h3 className="text-lg md:text-xl font-semibold text-gray-800 text-center md:text-right">
                    {monthLabel}
                </h3>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-1">
                {WEEK_DAYS.map((day) => (
                    <div key={day} className="py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden text-xs sm:text-sm">
                {calendarCells.map((day, idx) => {
                    if (day === null) {
                        return (
                            <div
                                key={`blank-${idx}`}
                                className="bg-gray-50 min-h-[70px] sm:min-h-[90px]"
                            />
                        );
                    }

                    const monthNumber = month + 1;
                    const yyyy = year.toString();
                    const mm = monthNumber.toString().padStart(2, "0");
                    const dd = day.toString().padStart(2, "0");
                    const dateKey = `${yyyy}-${mm}-${dd}`;

                    const dayTasks = tasksByDate[dateKey] || [];

                    const isToday = dateKey === todayKey;

                    // Any overdue task on this day? (date before today AND not completed)
                    const hasOverdue = dayTasks.some(
                        (t) => !isTaskCompleted(t) && dateKey < todayKey
                    );

                    return (
                        <div
                            key={`day-${day}-${idx}`}
                            className={`bg-white border border-gray-100 flex flex-col p-1.5 sm:p-2 min-h-[70px] sm:min-h-[90px] ${isToday
                                    ? "ring-2 ring-blue-500 ring-offset-1"
                                    : hasOverdue
                                        ? "ring-2 ring-red-400 ring-offset-1"
                                        : ""
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-gray-700">
                                    {day}
                                </span>
                                {dayTasks.length > 0 && (
                                    <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${hasOverdue
                                                ? "bg-red-50 text-red-700"
                                                : "bg-blue-50 text-blue-700"
                                            }`}
                                    >
                                        {dayTasks.length} task
                                        {dayTasks.length > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 overflow-hidden">
                                {dayTasks.slice(0, 3).map((task) => {
                                    const overdue =
                                        !isTaskCompleted(task) && dateKey < todayKey;

                                    return (
                                        <button
                                            key={task._id}
                                            type="button"
                                            onClick={() => onTaskClick && onTaskClick(task)}
                                            className={`w-full text-left text-[11px] sm:text-xs px-1.5 py-0.5 rounded truncate ${overdue
                                                    ? "bg-red-50 hover:bg-red-100 text-red-800"
                                                    : "bg-blue-50 hover:bg-blue-100 text-blue-800"
                                                }`}
                                            title={
                                                (task.title || task.name || "View task") +
                                                (overdue ? " (Overdue)" : "")
                                            }
                                        >
                                            {overdue && "⚠ "}
                                            {task.title || task.name || "Untitled task"}
                                        </button>
                                    );
                                })}

                                {dayTasks.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Optional: show full-day modal; for now, focus first task
                                            if (onTaskClick) onTaskClick(dayTasks[0]);
                                        }}
                                        className="text-[10px] text-gray-500 hover:underline"
                                    >
                                        + {dayTasks.length - 3} more
                                    </button>
                                )}
                            </div>

                            {/* Optional inline "edit first task" small link */}
                            {dayTasks.length > 0 && onTaskEdit && (
                                <button
                                    type="button"
                                    onClick={() => onTaskEdit(dayTasks[0])}
                                    className="mt-auto pt-1 text-[10px] text-gray-400 hover:text-gray-600 self-end"
                                >
                                    Edit first
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Small legend */}
            <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-blue-200" />{" "}
                    Upcoming / normal tasks
                </div>
                <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-red-200" />{" "}
                    Overdue tasks
                </div>
            </div>
        </div>
    );
}