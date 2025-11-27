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

const Home = () => {
    const { user } = useAuth();

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
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">3</h3>
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
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">2</h3>
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
                                <p className="text-slate-500 font-medium">Unread Messages</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">5</h3>
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

                    {/* Recent Activity (Mock) */}
                    <motion.div variants={item} className="card card-pad shadow-lg">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
                        <div className="space-y-4">
                            {[
                                { text: 'Mom took medication', time: '10 mins ago', color: 'bg-green-500' },
                                { text: 'Dad added a grocery item', time: '1 hour ago', color: 'bg-blue-500' },
                                { text: 'Appointment scheduled', time: '2 hours ago', color: 'bg-purple-500' },
                            ].map((activity, i) => (
                                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className={`w-2 h-2 mt-2 rounded-full ${activity.color}`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{activity.text}</p>
                                        <p className="text-xs text-slate-400">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Home;