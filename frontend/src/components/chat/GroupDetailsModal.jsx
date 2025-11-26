import { useState, useEffect } from "react";
import { getGroupStats } from "../../api/chatApi";
import api from "../../api/axios";

const GroupDetailsModal = ({ group, onClose }) => {
    const [activeTab, setActiveTab] = useState("members");
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch members
                const membersRes = await api.get(`/family-groups/group/${group._id}/members`);
                setMembers(membersRes.data.members || []);

                // Fetch stats
                const statsRes = await getGroupStats(group._id);
                setStats(statsRes.data);
            } catch (error) {
                console.error("Error fetching group details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (group?._id) {
            fetchData();
        }
    }, [group._id]);

    if (!group) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn m-4">
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-white text-[var(--brand-1)] flex items-center justify-center text-3xl font-bold shadow-lg mb-3">
                            {group.groupName?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-center">{group.groupName}</h2>
                        <p className="text-white/80 text-sm text-center mt-1">{group.description}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "members"
                            ? "text-[var(--brand-1)] border-b-2 border-[var(--brand-1)]"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        Members ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "stats"
                            ? "text-[var(--brand-1)] border-b-2 border-[var(--brand-1)]"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            }`}
                    >
                        Statistics
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 h-80 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-1)]"></div>
                        </div>
                    ) : activeTab === "members" ? (
                        <div className="space-y-3">
                            {members.map((member) => {
                                if (!member.userId) return null;
                                return (
                                    <div key={member.userId._id || Math.random()} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                                            {member.userId.firstName?.charAt(0) || "?"}{member.userId.lastName?.charAt(0) || ""}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {member.userId.firstName || "Unknown"} {member.userId.lastName || "User"}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                        </div>
                                        {member.status === 'active' && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-green-500"></span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center">
                                    <p className="text-3xl font-bold text-[var(--brand-1)]">{stats?.totalMessages || 0}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total Messages</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center">
                                    <p className="text-3xl font-bold text-[var(--brand-2)]">{stats?.uniqueSendersCount || 0}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Active Members</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Top Contributors</h4>
                                <div className="space-y-3">
                                    {stats?.topContributors?.map((contributor, index) => (
                                        <div key={contributor.userId} className="flex items-center gap-3">
                                            <span className="text-gray-400 font-mono text-sm w-4">{index + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                                        {contributor.firstName} {contributor.lastName}
                                                    </span>
                                                    <span className="text-gray-500">{contributor.messageCount} msgs</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)]"
                                                        style={{ width: `${(contributor.messageCount / (stats.totalMessages || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.topContributors || stats.topContributors.length === 0) && (
                                        <p className="text-sm text-gray-500 text-center italic">No messages yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupDetailsModal;
