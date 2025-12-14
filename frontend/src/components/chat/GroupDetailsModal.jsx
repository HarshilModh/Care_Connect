import { useState, useEffect } from "react";
import { getGroupStats } from "../../api/chatApi";
import api from "../../api/axios";
import ReactModal from "react-modal";
import { X, Users, Activity } from "lucide-react";

ReactModal.setAppElement('#root');

const GroupDetailsModal = ({ group, onClose }) => {
    const [activeTab, setActiveTab] = useState("members");
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (group?._id) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const membersRes = await api.get(`/family-groups/group/${group._id}/members`);
                    setMembers(membersRes.data.members || []);

                    const statsRes = await getGroupStats(group._id);
                    setStats(statsRes.data);
                } catch (error) {
                    console.error("Error fetching group details:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [group]);

    if (!group) return null;

    return (
        <ReactModal
            isOpen={!!group}
            onRequestClose={onClose}
            className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto mt-20 rounded-2xl shadow-2xl outline-none p-0 overflow-hidden"
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start overflow-y-auto pt-10 pb-10"
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {group.groupName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {group.description || "No description"}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab("members")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "members"
                        ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <Users className="w-4 h-4" /> Members ({members.length})
                </button>
                <button
                    onClick={() => setActiveTab("stats")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "stats"
                        ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    <Activity className="w-4 h-4" /> Statistics
                </button>
            </div>

            {/* Content */}
            <div className="p-6 h-96 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="text-sm">Loading...</span>
                    </div>
                ) : activeTab === "members" ? (
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div key={member.userId?._id || Math.random()} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                    {member.userId?.firstName?.charAt(0) || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {member.userId?.firstName} {member.userId?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                </div>
                                {member.status === 'active' && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                                        Active
                                    </span>
                                )}
                            </div>
                        ))}
                        {members.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No members found.</p>}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-indigo-600">{stats?.totalMessages || 0}</p>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Total Messages</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-green-600">{stats?.uniqueSendersCount || 0}</p>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Active Users</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Top Contributors</h4>
                            <div className="space-y-3">
                                {stats?.topContributors?.map((contributor, index) => (
                                    <div key={index} className="flex items-center gap-3 text-sm">
                                        <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {contributor.firstName} {contributor.lastName}
                                                </span>
                                                <span className="text-xs text-gray-500">{contributor.messageCount} msgs</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${(contributor.messageCount / (stats.totalMessages || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.topContributors?.length) && (
                                    <p className="text-center text-gray-400 text-xs italic py-2">No activity recorded yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ReactModal>
    );
};

export default GroupDetailsModal;
