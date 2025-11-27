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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-scaleIn border border-white/20">
                {/* Header */}
                <div className="p-8 bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] text-white relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all hover:rotate-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex flex-col items-center relative z-10">
                        <div className="h-24 w-24 rounded-full bg-white text-[var(--brand-1)] flex items-center justify-center text-4xl font-bold shadow-xl mb-4 ring-4 ring-white/30">
                            {group.groupName?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-center tracking-tight">{group.groupName}</h2>
                        <p className="text-white/80 text-sm text-center mt-2 max-w-[80%] leading-relaxed">{group.description || "No description available"}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 pt-2">
                    <button
                        onClick={() => setActiveTab("members")}
                        className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === "members"
                            ? "text-[var(--brand-1)]"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                    >
                        Members <span className="ml-1 text-xs opacity-70 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{members.length}</span>
                        {activeTab === "members" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-1)] rounded-t-full mx-8"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === "stats"
                            ? "text-[var(--brand-1)]"
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                    >
                        Statistics
                        {activeTab === "stats" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-1)] rounded-t-full mx-8"></div>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 h-80 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-1)]"></div>
                            <p className="text-xs text-gray-400 font-medium">Loading details...</p>
                        </div>
                    ) : activeTab === "members" ? (
                        <div className="space-y-3">
                            {members.map((member) => {
                                if (!member.userId) return null;
                                return (
                                    <div key={member.userId._id || Math.random()} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                                            {member.userId.firstName?.charAt(0) || "?"}{member.userId.lastName?.charAt(0) || ""}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {member.userId.firstName || "Unknown"} {member.userId.lastName || "User"}
                                            </p>
                                            <p className="text-xs text-gray-500 capitalize font-medium">{member.role}</p>
                                        </div>
                                        {member.status === 'active' && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Active</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                    <p className="text-3xl font-black text-[var(--brand-1)] mb-1">{stats?.totalMessages || 0}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Messages</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                                    <p className="text-3xl font-black text-[var(--brand-2)] mb-1">{stats?.uniqueSendersCount || 0}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Active Members</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Contributors</h4>
                                <div className="space-y-4">
                                    {stats?.topContributors?.map((contributor, index) => (
                                        <div key={contributor.userId} className="flex items-center gap-3">
                                            <span className={`
                                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                                ${index === 0 ? "bg-yellow-100 text-yellow-600" :
                                                    index === 1 ? "bg-gray-100 text-gray-600" :
                                                        index === 2 ? "bg-orange-100 text-orange-600" : "text-gray-400"}
                                            `}>
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="font-bold text-gray-700 dark:text-gray-200">
                                                        {contributor.firstName} {contributor.lastName}
                                                    </span>
                                                    <span className="text-gray-500 font-medium">{contributor.messageCount} msgs</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] rounded-full transition-all duration-500 ease-out"
                                                        style={{ width: `${(contributor.messageCount / (stats.totalMessages || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.topContributors || stats.topContributors.length === 0) && (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-gray-400 italic">No activity yet</p>
                                        </div>
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
