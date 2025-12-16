import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import api from "../api/axios.js";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Calendar as CalendarIcon,
  Pill,
  StickyNote,
  CheckSquare,
  User,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import EditTaskModal from "../components/tasks/taskEdit.jsx";
import "react-toastify/dist/ReactToastify.css";
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const setView = (view) => {
    toolbar.onView(view);
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-lg font-bold text-gray-800 capitalize">
        {date.format('MMMM')} <span className="text-gray-400 font-light">{date.format('YYYY')}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={goToBack}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToCurrent}
          className="px-4 py-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
        >
          Today
        </button>
        <button
          onClick={goToNext}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center">
        {label()}
      </div>
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {['month', 'week', 'day'].map((view) => (
          <button
            key={view}
            onClick={() => setView(view)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${toolbar.view === view
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

const CustomEvent = ({ event }) => {
  const type = event.resource.type;

  let styles = "bg-blue-50 text-blue-700 border-l-4 border-blue-500";
  if (type === 'medication') styles = "bg-red-50 text-red-700 border-l-4 border-red-500";
  else if (type === 'event') styles = "bg-purple-50 text-purple-700 border-l-4 border-purple-500";
  else if (type === 'note') styles = "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500";

  return (
    <div className={`text-xs px-2 py-1 rounded-r-md h-full w-full flex items-center gap-1 font-medium truncate ${styles}`}>
      {type === 'medication' && <Pill className="w-3 h-3 flex-shrink-0" />}
      {type === 'event' && <CalendarIcon className="w-3 h-3 flex-shrink-0" />}
      {type === 'note' && <StickyNote className="w-3 h-3 flex-shrink-0" />}
      <span className="truncate">{event.title}</span>
    </div>
  );
};


export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showEditModal, setShowEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const navigate = useNavigate();

  let userId = "";
  try {
    const storedUser = localStorage.getItem("user");
    userId = storedUser ? JSON.parse(storedUser)._id : "";
  } catch (err) {
    console.error("User parse error", err);
  }

  const fetchTasks = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // const res = await fetch(`http://localhost:3000/api/tasks/search?userId=${userId}`);
      const res = await api.get(`/tasks/search?userId=${userId}`);

      if (res.status !== 200) throw new Error("Failed to fetch tasks");
      const data = await res.data;
      console.log("Fetched tasks:", data);
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all'
        ? true
        : task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    missed: tasks.filter(t => t.status === 'missed').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  const markComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      const endpoint = newStatus === 'completed' ? 'complete' : 'uncomplete';
      if (endpoint === 'uncomplete') {
        // const res = await fetch(
        //   `http://localhost:3000/api/tasks/${taskId}/uncomplete`,
        //   {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ uncompletedBy: userId }),
        //   }
        // );
        const res = await api.post(`/tasks/${taskId}/uncomplete`, { uncompletedBy: userId });
        console.log("Uncomplete response:", res);
        if (res.status !== 200) throw new Error("Failed to uncomplete task");
      } else {
        // const res = await fetch(
        //   `http://localhost:3000/api/tasks/${taskId}/complete`,
        //   {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ completedBy: userId }),
        //   }
        // );
        const res = await api.post(`/tasks/${taskId}/complete`, { completedBy: userId });
        console.log("Complete response:", res);
        if (res.status !== 200) throw new Error("Failed to update task");
        toast.success(newStatus === 'completed' ? "Task completed!" : "Task reopened");
      }

    } catch (err) {
      toast.error(err.message);
      fetchTasks();
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      // const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
      //   method: "DELETE",
      // });
      const res = await api.delete(`/tasks/${taskId}`);
      if (res.status !== 200) throw new Error("Failed to delete task");
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };



  const getTypeIcon = (type) => {
    switch (type) {
      case 'medication': return <Pill className="w-4 h-4 text-red-500" />;
      case 'event': return <CalendarIcon className="w-4 h-4 text-purple-500" />;
      case 'note': return <StickyNote className="w-4 h-4 text-yellow-500" />;
      default: return <CheckSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No Due Date";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  const calendarEvents = useMemo(() => {
    return filteredTasks.map(task => ({
      id: task._id,
      title: task.title,
      start: task.dueAt ? new Date(task.dueAt) : new Date(),
      end: task.dueAt ? moment(task.dueAt).add(1, 'hour').toDate() : moment().add(1, 'hour').toDate(),
      resource: task,
      allDay: false
    }));
  }, [filteredTasks]);

  const onNavigate = (newDate) => setCurrentDate(newDate);
  const onView = (newView) => setCurrentView(newView);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Dashboard</h1>
            <p className="text-gray-500 text-sm">Manage care responsibilities</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-gray-200 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Calendar
              </button>
            </div>

            <button
              onClick={() => navigate("/tasks/create")}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
            >
              <Plus className="w-5 h-5" /> Create Task
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-semibold uppercase">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-yellow-600 text-xs font-semibold uppercase">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-red-600 text-xs font-semibold uppercase">Missed</p>
              <p className="text-2xl font-bold text-red-700">{stats.missed}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-green-600 text-xs font-semibold uppercase">Completed</p>
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
              {['all', 'pending', 'missed', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'list' ? (
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white h-24 rounded-xl animate-pulse shadow-sm"></div>
              ))
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No tasks found matching your filters.</p>
                <button onClick={() => { setSearch(''); setStatusFilter('all') }} className="text-blue-600 text-sm mt-2 hover:underline">Clear filters</button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className={`group bg-white rounded-xl p-5 border transition-all hover:shadow-md ${task.status === 'completed' ? 'border-gray-100 bg-gray-50/50' :
                    task.status === 'missed' ? 'border-red-200 bg-red-50/30' :
                      'border-gray-200'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => markComplete(task._id, task.status)}
                      className={`mt-1 flex-shrink-0 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-500'
                        }`}
                    >
                      {task.status === 'completed'
                        ? <CheckCircle2 className="w-6 h-6 fill-green-50" />
                        : <Circle className="w-6 h-6" />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${task.type === 'medication' ? 'bg-red-50 text-red-600 border-red-100' :
                          task.type === 'event' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          {getTypeIcon(task.type)}
                          {task.type}
                        </span>

                        {task.dueAt && (
                          <span className={`flex items-center gap-1 text-[11px] font-medium ${new Date(task.dueAt) < new Date() && task.status !== 'completed' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            <Clock className="w-3 h-3" />
                            {new Date(task.dueAt).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

                          </span>
                        )}
                      </div>

                      <h3 className={`font-semibold text-lg truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'
                        }`}>
                        {task.title}
                      </h3>

                      <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                        {task.description || "No description provided."}
                      </p>

                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                        {task.recipientId && (
                          <div className="flex items-center gap-1.5" title="Recipient">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>For: {task.recipientId.firstName} {task.recipientId.lastName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {task.createdBy === userId && (
                      <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setTaskToEdit(task);
                              setShowEditModal(true);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition"
                            title="Edit Task"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="text-gray-400 hover:text-red-600 transition"
                          title="Delete Task"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-[700px]">

            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month', 'week', 'day']}
              defaultView="month"

              date={currentDate}
              view={currentView}
              onNavigate={onNavigate}
              onView={onView}
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent
              }}

              onSelectEvent={(event) => {
                if (event.resource.status === 'completed') return;
                setTaskToEdit(event.resource);
                setShowEditModal(true);
              }}
              className="text-sm border-0"
            />
          </div>
        )}

        {showEditModal && (
          <EditTaskModal
            task={taskToEdit}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={fetchTasks}
          />
        )}

        <ToastContainer
          position="bottom-right"
          autoClose={2000}
          hideProgressBar={true}
          theme="colored"
        />
      </div>
    </div>
  );
}
