import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    X,
    Pill,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Type,
    Scale,
    Timer,
    FileText
} from 'lucide-react';

const AddMedicationModal = ({ isOpen, onClose, onSuccess }) => {
    const { groupId } = useParams();
    const { user } = useAuth();

    // Form State
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [timesPerDay, setTimesPerDay] = useState(1);
    const [supplyCount, setSupplyCount] = useState(30);
    const [refillDate, setRefillDate] = useState('');
    const [instructions, setInstructions] = useState('');
    const [notes, setNotes] = useState('');

    // Logic State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recipientId, setRecipientId] = useState('');
    const [recipients, setRecipients] = useState([]); // List of available recipients

    // 1. Fetch the Care Recipients for this group
    useEffect(() => {
        const fetchRecipients = async () => {
            if (!groupId || !isOpen) return;
            try {
                const { data } = await api.get(`/care-recipients/group/${groupId}`);
                if (Array.isArray(data)) {
                    setRecipients(data);
                    // Auto-select if only one
                    if (data.length === 1) {
                        const userObj = data[0].userId;
                        setRecipientId(userObj._id || userObj);
                    }
                }
            } catch (err) {
                console.error("Could not find care recipients", err);
            }
        };
        fetchRecipients();
    }, [groupId, isOpen]);

    const handleSubmit = async () => {
        if (!name) {
            setError("Medication Name is required.");
            return;
        }
        if (!recipientId) {
            setError("Please select a Care Recipient.");
            return;
        }
        if (!groupId) {
            setError("Invalid Group. Please reload the page.");
            return;
        }
        if (!user || !user._id) {
            setError("Invalid User. Please reload the page.");
            return;
        }
        if (!dosage) {
            setError("Dosage is required.");
            return;
        }
        if (dosage.length > 50) {
            const dosagePattern = /^.{0,50}$/;
            if (!dosagePattern.test(dosage)) {
                setError("Dosage must be less than 50 characters.");
                return;
            }
        }
        const timeePerDayNumRegex = /^\d+$/;
        if (!timeePerDayNumRegex.test(timesPerDay)) {
            setError("Times per day must be a valid number.");
            return;
        }
        if (Number(timesPerDay) <= 0) {
            setError("Times per day must be at least 1.");
            return;
        }
    
        const supplyCountNumRegex = /^\d+$/;
        if (!supplyCountNumRegex.test(supplyCount)) {
            setError("Supply count must be a valid number.");
            return;
        }
        if (Number(supplyCount) < 0) {
            setError("Supply count cannot be negative.");
            return;
        }
        if(!refillDate){
            setError("Refill date is required.");
            return;
        }
        if (refillDate) {
            const selectedDate = new Date(refillDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                setError("Refill date cannot be in the past.");
                return;
            }
        }
        setLoading(true);
        setError(null);

        try {
            await api.post(`/medications`, {
                groupId,
                recipientId,
                createdBy: user._id,
                name,
                dosage,
                frequency,
                timesPerDay: Number(timesPerDay),
                supplyCount: Number(supplyCount),
                refillDate: refillDate ? new Date(refillDate) : null,
                instructions,
                notes
            });

            // Reset and Close
            setName('');
            setDosage('');
            setInstructions('');
            setNotes('');
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error adding medication:", err);
            setError(err.response?.data?.error || 'Failed to add medication.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Pill className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">New Prescription</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Recipient Dropdown (New) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Who is this for? *</label>
                        <div className="relative">
                            <input
                                type="hidden"
                            />
                            <select
                                className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value)}
                            >
                                <option value="">Select Care Recipient</option>
                                {recipients.map((r) => {
                                    const u = r.userId;
                                    const label = u.firstName ? `${u.firstName} ${u.lastName}` : 'Unknown';
                                    const uid = u._id || u;
                                    return (
                                        <option key={r._id} value={uid}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Medication Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <div className="relative">
                                    <Type className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="Lipitor"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                                <div className="relative">
                                    <Scale className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="10mg"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Schedule & Supply</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                <div className="relative">
                                    <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <select
                                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="as_needed">As Needed</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Times per Day</label>
                                <div className="relative">
                                    <Timer className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={timesPerDay}
                                        onChange={(e) => setTimesPerDay(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Supply</label>
                                <div className="relative">
                                    <Pill className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={supplyCount}
                                        onChange={(e) => setSupplyCount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Refill Date</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="date"
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={refillDate}
                                        // min value today's date
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setRefillDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <div className="relative">
                            <FileText className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <textarea
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Take with food, do not crush..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" />
                        )}
                        {loading ? 'Saving...' : 'Add Medication'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMedicationModal;