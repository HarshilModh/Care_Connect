import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    X,
    Activity,
    Heart,
    Thermometer,
    Wind,
    Droplets,
    Clock,
    FileText,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const AddVitalsModal = ({ isOpen, onClose, groupId, userId, onSuccess }) => {
    const [type, setType] = useState("");
    const [value, setValue] = useState("");
    const [unit, setUnit] = useState("");
    const [recordedAt, setRecordedAt] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        switch (type) {
            case 'bp': setUnit('mmHg'); break;
            case 'heart_rate': setUnit('bpm'); break;
            case 'weight': setUnit('lbs'); break;
            case 'glucose': setUnit('mg/dL'); break;
            case 'temperature': setUnit('°F'); break;
            default: setUnit('');
        }
    }, [type]);

    useEffect(() => {
        if (isOpen) {
            setType("");
            setValue("");
            setUnit("");
            setNotes("");
            setRecordedAt(new Date().toISOString().slice(0, 16));
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!type || !value || !unit) {
            setError("Please fill in all required fields.");
            return;
        }
        setLoading(true);
        setError(null);

        if (type === 'bp') {
            //value will be number in format "systolic/diastolic"
            const bpPattern = /^\d{2,3}\/\d{2,3}$/;
            if (!bpPattern.test(value)) {
                setError("Please enter a valid blood pressure reading (e.g., 120/80).");
                setLoading(false);
                return;
            }
        } else {
            const numericValue = parseFloat(value);
            if (isNaN(numericValue) || numericValue <= 0) {
                setError("Please enter a valid numeric value.");
                setLoading(false);
                return;
            }
        }
        if (type === "") {
            setError("Please select a vital type.");
            setLoading(false);
            return;
        }
        //input validation heart
        if (type === 'heart_rate') {
            const hrValue = parseInt(value, 10);
            if (hrValue < 30 || hrValue > 220) {
                setError("Please enter a realistic heart rate value (30-220 bpm).");
                setLoading(false);
                return;
            }
        }
        //input validation temperature
        if (type === 'temperature') {
            const tempValue = parseFloat(value);
            if (tempValue < 80 || tempValue > 110) {
                setError("Please enter a realistic body temperature value (80-110 °F).");
                setLoading(false);
                return;
            }
        }
        //input validation glucose
        if (type === 'glucose') {
            const glucoseValue = parseInt(value, 10);
            if (glucoseValue < 40 || glucoseValue > 600) {
                setError("Please enter a realistic blood glucose value (40-600 mg/dL).");
                setLoading(false);
                return;
            }
        }
        //input validation weight
        if (type === 'weight') {
            const weightValue = parseFloat(value);
            if (weightValue < 10 || weightValue > 1000) {
                setError("Please enter a realistic weight value (10-1000 lbs).");
                setLoading(false);
                return;
            }
        }
        try {
            await api.post(`/vitals`, {
                groupId,
                userId,
                type,
                value,
                unit,
                recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
                notes
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error adding vital:", err);
            setError(err.response?.data?.error || "Failed to add vital.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getTypeIcon = () => {
        switch (type) {
            case 'heart_rate': return <Heart className="w-5 h-5 text-rose-500" />;
            case 'bp': return <Activity className="w-5 h-5 text-blue-500" />;
            case 'temperature': return <Thermometer className="w-5 h-5 text-amber-500" />;
            case 'glucose': return <Droplets className="w-5 h-5 text-teal-500" />;
            case 'weight': return <Wind className="w-5 h-5 text-indigo-500" />;
            default: return <Activity className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Log Vital Sign</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-50 p-2 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Type</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {[
                                { id: 'bp', label: 'BP', icon: Activity },
                                { id: 'heart_rate', label: 'Heart', icon: Heart },
                                { id: 'glucose', label: 'Glucose', icon: Droplets },
                                { id: 'weight', label: 'Weight', icon: Wind },
                                { id: 'temperature', label: 'Temp', icon: Thermometer },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setType(item.id)}
                                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all h-20 ${type === item.id
                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-500'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${type === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className="text-[10px] font-semibold">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reading Value</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {getTypeIcon()}
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-gray-900 placeholder-gray-300"
                                    placeholder={type === 'bp' ? "120/80" : "0"}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-500 font-medium cursor-default"
                                    value={unit}
                                    readOnly
                                    placeholder="--"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time</label>
                            <div className="relative">
                                <Clock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="datetime-local"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 text-sm"
                                    value={recordedAt}
                                    onChange={(e) => setRecordedAt(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <div className="relative">
                                <FileText className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder-gray-300"
                                    placeholder="Add context..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Save Record</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddVitalsModal;