import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    Users,
    Heart,
    Activity,
    Thermometer,
    Wind,
    Plus,
    Clock,
    Calendar,
    FileText,
    TrendingUp,
    ChevronRight,
    Droplets,
    ArrowDown,
    Trash2
} from 'lucide-react';
import AddVitalsModal from './AddVitalsModal.jsx';
import VitalChart from './VitalChart.jsx';

const VitalsDashboard = () => {
    const { groupId } = useParams();
    const { user } = useAuth();


    // 1. Recipient State
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipientId, setSelectedRecipientId] = useState('');

    // 2. Data State
    const [latestVitals, setLatestVitals] = useState({});
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    //modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const onSuccess = () => {
        fetchVitalsData();
    };
    // Initial Fetch: Recipients
    useEffect(() => {
        const fetchRecipients = async () => {
            try {
                const { data } = await api.get(`/care-recipients/group/${groupId}`);
                console.log("Fetched Recipients:", data);
                setRecipients(data);
                if (data.length === 0) {
                    setSelectedRecipientId('');
                    return;
                }
                if (data.length > 0) {
                    setSelectedRecipientId(data[0].userId._id);
                }
            } catch (err) {
                // console.log(err.message);
                console.error("Error fetching recipients", err);
            }
        };
        fetchRecipients();
    }, [groupId]);

    // Data Fetch: Vitals
    const fetchVitalsData = async () => {
        if (!groupId || !selectedRecipientId) return;

        setLoading(true);
        try {
            const latestRes = await api.get('/vitals/latest', {
                params: { groupId, userId: selectedRecipientId }
            });
            setLatestVitals(latestRes.data);

            const historyRes = await api.get('/vitals/history', {
                params: {
                    groupId,
                    userId: selectedRecipientId,
                    rangeDays: 30
                }
            });
            console.log("latest Vitals:", latestRes.data);
            console.log("history Vitals:", historyRes.data);
            // Get IDs of latest vitals to exclude them from history
            const latestIds = new Set(Object.values(latestRes.data).map(v => v._id));

            // Explicitly sort by recordedAt (Newest First) AND filter out duplicates
            const sortedData = historyRes.data
                .filter(item => !latestIds.has(item._id))
                .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));

            setHistoryData(sortedData);

        } catch (error) {
            console.error("Error fetching vitals", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVitalsData();
    }, [groupId, selectedRecipientId]);

    const getVitalIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'heart_rate': return <Heart className="w-5 h-5 text-rose-500" />;
            case 'bp': return <Activity className="w-5 h-5 text-blue-500" />;
            case 'temperature': return <Thermometer className="w-5 h-5 text-amber-500" />;
            case 'glucose': return <Droplets className="w-5 h-5 text-teal-500" />;
            case 'weight': return <Wind className="w-5 h-5 text-indigo-500" />;
            default: return <Activity className="w-5 h-5 text-gray-500" />;
        }
    };
    const deleteVital = async (vitalId) => {
        try {
            console.log("Deleting vital with ID:", vitalId);
            await api.delete(`/vitals/${vitalId}`, {
                data: {
                    userId: selectedRecipientId,
                    groupId: groupId
                }
            });
            fetchVitalsData();
        } catch (error) {
            console.error("Error deleting vital", error);
        }
    };
    const MetricCard = ({ title, value, unit, icon: Icon, colorClass, type }) => (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-gray-200 transition-colors h-32">
            <div className="text-right">
                <button
                    onClick={() => {
                        deleteVital(latestVitals[type]?._id);
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                    title="Delete Latest Log"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="flex justify-between items-start">
                <span className="text-gray-500 text-sm font-medium">{title}</span>
                <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.split(' ')[0]} bg-gray-50`}>
                    <Icon className={`w-5 h-5 ${colorClass.match(/text-\w+-\d+/)[0]}`} />
                </div>
            </div>
            <div>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-bold text-gray-900">
                        {value || '--'}
                    </h3>
                    <span className="text-sm text-gray-400 font-medium">{unit}</span>
                </div>
            </div>
        </div>
    );
    if(recipients.length === 0){
        return (
            <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 p-6 flex flex-col items-center justify-center">
                <div className="max-w-2xl mx-auto text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">No Care Recipients Found</h1>
                    <p className="text-gray-500 mb-6">Please add care recipients to this family group to start logging vitals.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 p-6">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Health Dashboard</h1>
                        <p className="text-gray-500 text-sm mt-1">Track vital signs and health trends.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <select
                                className="w-full md:w-64 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                value={selectedRecipientId}
                                onChange={(e) => setSelectedRecipientId(e.target.value)}
                            >
                                {recipients.map((r) => (
                                    <option key={r._id} value={r.userId._id}>
                                        {r.userId.firstName} {r.userId.lastName}
                                    </option>
                                ))}
                            </select>
                            <ArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Vital</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                        <p className="text-sm">Loading data...</p>
                    </div>
                ) : (
                    <div className="space-y-8">

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Heart Rate"
                                value={latestVitals.heart_rate?.value}
                                unit="bpm"
                                icon={Heart}
                                colorClass="bg-rose-50 text-rose-500"
                                type="heart_rate"
                            />
                            <MetricCard
                                title="Blood Pressure"
                                value={latestVitals.bp?.value}
                                unit="mmHg"
                                icon={Activity}
                                colorClass="bg-blue-50 text-blue-500"
                                type="bp"
                            />
                            <MetricCard
                                title="Glucose"
                                value={latestVitals.glucose?.value}
                                unit="mg/dL"
                                icon={Droplets}
                                colorClass="bg-teal-50 text-teal-500"
                                type="glucose"
                            />
                            <MetricCard
                                title="Weight"
                                value={latestVitals.weight?.value}
                                unit="lbs"
                                icon={Wind}
                                colorClass="bg-indigo-50 text-indigo-500"
                                type="weight"
                            />
                            <MetricCard
                                title="Temperature"
                                value={latestVitals.temperature?.value}
                                unit="°F"
                                icon={Thermometer}
                                colorClass="bg-amber-50 text-amber-500"
                                type="temperature"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-gray-400" /> Heart Rate Trend
                                </h3>
                                <div className="flex-1 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center bg-gray-50/50">
                                    <VitalChart data={historyData.filter(log => log.type === 'heart_rate')} color="#ef4444" unit="bpm" />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-gray-400" /> BP Trend
                                </h3>
                                <div className="flex-1 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center bg-gray-50/50">
                                    <VitalChart data={historyData.filter(log => log.type === 'bp')} color="#3b82f6" unit="mmHg" />

                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                <h3 className="font-semibold text-gray-900">Recent Logs</h3>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {historyData.length > 0 ? (
                                    historyData.map((log, index) => {
                                        const date = new Date(log.recordedAt || log.createdAt);

                                        return (
                                            <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-gray-50 rounded-full border border-gray-100">
                                                        {getVitalIcon(log.type)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 capitalize">
                                                            {log.type?.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <span>{date.toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <button
                                                        onClick={() => deleteVital(log._id)}
                                                        className="text-red-500 hover:text-red-700 text-xs mb-1"
                                                    >
                                                        Delete
                                                    </button>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {log.value} <span className="font-normal text-gray-500 text-xs">{log.unit}</span>
                                                    </div>
                                                    {log.notes && (
                                                        <p className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate">
                                                            {log.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                            <FileText className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">No logs recorded yet</p>
                                        <p className="text-xs text-gray-500 mt-1">Measurements will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <AddVitalsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                groupId={groupId}
                userId={selectedRecipientId}
                onSuccess={onSuccess}
            />
        </div>
    );
};

export default VitalsDashboard;