import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import {
  ArrowLeft,
  Users,
  Shield,
  Heart,
  User,
  CheckCircle2,
  Circle,
  Clock,
  CalendarDays,
  MoreVertical,
  LayoutDashboard
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import CareGiverModal from './CareGiverModal';
import CareRecipentModal from './CareRecipentModal';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  // State
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(null);
  const [selectedCareRecipientId, setSelectedCareRecipientId] = useState(null);

  // Derived State
  const [stats, setStats] = useState({
    admins: [],
    careGivers: [],
    careRecipients: [],
    others: []
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;

      setLoading(true);
      try {
        // 1. Fetch Group Details
        const groupRes = await axios.get(`http://localhost:3000/api/family-groups/group/${groupId}`, { withCredentials: true });
        setGroup(groupRes.data);

        // 2. Fetch Members
        const membersRes = await axios.get(`http://localhost:3000/api/memberships/group/${groupId}`, { withCredentials: true });
        const membersData = Array.isArray(membersRes.data) ? membersRes.data : [];
        setMembers(membersData);

        // Process roles
        setStats({
          admins: membersData.filter(m => m.role === 'admin' || m.role === 'owner'),
          careGivers: membersData.filter(m => m.role === 'careGiver'),
          careRecipients: membersData.filter(m => m.role === 'careRecipient'),
          others: membersData.filter(m => !['admin', 'owner', 'careGiver', 'careRecipient'].includes(m.role))
        });

        // 3. Fetch Tasks
        // Note: Assuming endpoint exists based on your snippet
        try {
          const tasksRes = await axios.get(`http://localhost:3000/api/tasks/group/${groupId}`, { withCredentials: true });
          setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
        } catch (taskErr) {
          console.warn("Could not fetch tasks", taskErr);
          // Don't fail the whole page if tasks fail
        }

      } catch (err) {
        console.error("Error loading group details:", err);
        setError(err.message || "Failed to load group details");
        toast.error("Failed to load group details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  // Helpers
  const initials = (user) => {
    if (!user?.firstName) return "?";
    return `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const MemberCard = ({ member, icon: Icon, colorClass, bgClass, onClick }) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-indigo-200' : ''}`}
    >
      <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${colorClass} font-bold text-sm shrink-0`}>
        {initials(member.userId)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {member.userId?.firstName} {member.userId?.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate capitalize">{member.role}</p>
      </div>
      <div className={`p-1.5 rounded-lg ${bgClass} ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );

  const TaskRow = ({ task }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.title}
          </p>
          {task.dueAt && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(task.dueAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
        {task.status || 'Pending'}
      </div>
    </div>
  );

  const Skeleton = () => (
    <div className="animate-pulse bg-gray-200 rounded-xl h-24 w-full"></div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton /><Skeleton /><Skeleton />
          </div>
        </div>
      </main>
    );
  }

  if (error || !group) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Group not found</h2>
          <p className="text-gray-500 mt-2">{error || "This group may have been deleted or you don't have access."}</p>
          <button onClick={() => navigate('/family-groups')} className="mt-4 btn-primary">
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/family-groups')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </button>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-32 h-32 text-indigo-600 transform rotate-12 translate-x-8 -translate-y-8" />
            </div>

            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
              <p className="text-gray-500 max-w-2xl">{group.description || "No description provided."}</p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{members.length}</span> Members
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="font-semibold">{tasks.length}</span> Tasks
                </div>
                <button
                  onClick={() => navigate(`/groups/edit/${groupId}`)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  <MoreVertical className="w-4 h-4" /> Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Members Breakdown */}
          <div className="lg:col-span-2 space-y-6">

            {/* Care Recipients */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" /> Care Recipients
              </h2>
              {stats.careRecipients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.careRecipients.map(m => (
                    <MemberCard
                      key={m._id}
                      member={m}
                      icon={User}
                      colorClass="text-amber-600"
                      bgClass="bg-amber-50"
                      onClick={() => setSelectedCareRecipientId(m.userId._id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic p-4 bg-white rounded-xl border border-dashed border-gray-200">No care recipients assigned.</p>
              )}
            </section>

            {/* Care Givers */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" /> Care Givers
              </h2>
              {stats.careGivers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.careGivers.map(m => (
                    <MemberCard
                      key={m._id}
                      member={m}
                      icon={Heart}
                      colorClass="text-rose-600"
                      bgClass="bg-rose-50"
                      onClick={() => setSelectedCaregiverId(m.userId._id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic p-4 bg-white rounded-xl border border-dashed border-gray-200">No care givers assigned.</p>
              )}
            </section>

            {/* Admins */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" /> Admins & Family
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...stats.admins, ...stats.others].map(m => (
                  <MemberCard
                    key={m._id}
                    member={m}
                    icon={Shield}
                    colorClass="text-indigo-600"
                    bgClass="bg-indigo-50"
                  />
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Tasks & Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-500" /> Recent Tasks
                </h2>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View My Tasks
                </button>
              </div>

              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.slice(0, 5).map(task => (
                    <TaskRow key={task._id} task={task} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No active tasks for this group.</p>
                    <button
                      onClick={() => navigate('/tasks/create')}
                      className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      + Create Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
        <ToastContainer position="bottom-right" theme="colored" />

        {/* Modals */}
        <CareGiverModal
          isOpen={!!selectedCaregiverId}
          onClose={() => setSelectedCaregiverId(null)}
          careGiverId={selectedCaregiverId}
        />
        <CareRecipentModal
          isOpen={!!selectedCareRecipientId}
          onClose={() => setSelectedCareRecipientId(null)}
          careRecipentId={selectedCareRecipientId}
          groupId={groupId}
        />
      </div>
    </main>
  );
}

export default GroupDetails;