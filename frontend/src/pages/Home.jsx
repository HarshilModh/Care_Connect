import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ClipboardDocumentCheckIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    PlusCircleIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import api from '../api/axios';

const Home = () => {
    const { user } = useAuth();
    const [tasks, settasks] = useState([]);
    const [groups, setgroups] = useState([]);
    const [messages, setmessages] = useState([]);
    const [activities, setactivities] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fix: Use query param for tasks
                const tasksRes = await api.get('/tasks', {
                    params: { userId: user._id }
                });

                // Fix: Flatten the grouped tasks response
                // Response is { groupId: { tasks: [] }, ... }
                const tasksData = tasksRes.data || {};
                const allTasks = Object.values(tasksData).flatMap(group => group.tasks || []);
                settasks(allTasks);

                const groupsRes = await api.get('/family-groups/user/' + user._id);
                // Fix: Access data directly (backend returns array)
                const fetchedGroups = groupsRes.data || [];
                setgroups(fetchedGroups);

                // Chat stats: Since we don't have a 'all user chats' endpoint, 
                // we'll use active groups as a proxy for active chats for now.
                setmessages(fetchedGroups); // Using groups as proxy for now

                // Derive recent activity from tasks
                const recentTasks = allTasks
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3)
                    .map(task => ({
                        text: `${task.status === 'completed' ? 'Completed' : 'New'} task: ${task.title}`,
                        time: task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'Recently',
                        color: task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }));
                setactivities(recentTasks);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        if (user?._id) {
            fetchData();
        }
    }, [user]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    // Calculate stats
    const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
    const activeGroupsCount = groups.length;
    // Every group is a chat channel
    const activeChatsCount = groups.length;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {/* Welcome Section */}
                <motion.div variants={item} className="text-center md:text-left mb-8">
                    <h1 className="section-title text-4xl mb-2">
                        Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
                    </h1>
                    <p className="section-sub text-lg text-left">
                        Here's what's happening with your care circle today.
                    </p>
                </motion.div>

                {/* Quick Stats Grid */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card card-pad shadow-lg hover:shadow-xl transition-shadow border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 font-medium">Pending Tasks</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{pendingTasksCount}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                                <ClipboardDocumentCheckIcon className="w-8 h-8" />
                            </div>
                        </div>
                        <Link to="/tasks" className="text-sm text-indigo-600 font-semibold mt-4 inline-flex items-center gap-1 hover:gap-2 transition-all">
                            View all tasks <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="card card-pad shadow-lg hover:shadow-xl transition-shadow border-l-4 border-violet-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 font-medium">Active Groups</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{activeGroupsCount}</h3>
                            </div>
                            <div className="p-3 bg-violet-50 rounded-full text-violet-600">
                                <UserGroupIcon className="w-8 h-8" />
                            </div>
                        </div>
                        <Link to="/family-groups" className="text-sm text-violet-600 font-semibold mt-4 inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Manage groups <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="card card-pad shadow-lg hover:shadow-xl transition-shadow border-l-4 border-fuchsia-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 font-medium">Active Chats</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{activeChatsCount}</h3>
                            </div>
                            <div className="p-3 bg-fuchsia-50 rounded-full text-fuchsia-600">
                                <ChatBubbleLeftRightIcon className="w-8 h-8" />
                            </div>
                        </div>
                        <Link to="/chat" className="text-sm text-fuchsia-600 font-semibold mt-4 inline-flex items-center gap-1 hover:gap-2 transition-all">
                            Go to chat <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Actions */}
                    <motion.div variants={item} className="lg:col-span-2">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/tasks/create" className="group p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <PlusCircleIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Create New Task</h3>
                                    <p className="text-sm text-slate-500">Assign a todo to a member</p>
                                </div>
                            </Link>

                            <Link to="/createGroup" className="group p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex items-center gap-4">
                                <div className="p-3 bg-violet-100 text-violet-600 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                    <UserGroupIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Create Family Group</h3>
                                    <p className="text-sm text-slate-500">Start a new care circle</p>
                                </div>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div variants={item} className="card card-pad shadow-lg">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
                        <div className="space-y-4">
                            {activities.length > 0 ? (
                                activities.map((activity, i) => (
                                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${activity.color}`} />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{activity.text}</p>
                                            <p className="text-xs text-slate-400">{activity.time}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No recent activity.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Home;