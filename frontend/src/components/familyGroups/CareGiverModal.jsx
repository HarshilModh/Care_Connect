import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { X, User, Award, BookOpen, Clock, FileText } from 'lucide-react';
import api from '../../api/axios';

ReactModal.setAppElement('#root');

const CareGiverModal = ({ isOpen, onClose, careGiverId }) => {
    const [careGiver, setCareGiver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !careGiverId) return;

        const fetchCareGiver = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`http://localhost:3000/api/caregivers/user/${careGiverId}`);
                setCareGiver(response.data);
            } catch (err) {
                console.error("Error fetching care giver:", err);
                setError("Could not load caregiver details.");
            } finally {
                setLoading(false);
            }
        };

        fetchCareGiver();
    }, [isOpen, careGiverId]);

    const modalStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            maxWidth: '500px',
            width: '90%',
            padding: '0',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxHeight: '90vh',
            overflow: 'auto',
        },
    };

    if (!isOpen) return null;

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onClose}
            style={modalStyles}
            contentLabel="Caregiver Details"
        >
            <div className="bg-white">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Caregiver Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-20 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <p>{error}</p>
                        </div>
                    ) : careGiver ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                    {careGiver.userId?.firstName?.[0]}{careGiver.userId?.lastName?.[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {careGiver.userId?.firstName} {careGiver.userId?.lastName}
                                    </h3>
                                    <p className="text-sm text-gray-500">Professional Caregiver</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase mb-1">
                                        <Clock className="w-3 h-3" /> Experience
                                    </div>
                                    <p className="font-semibold text-gray-900">{careGiver.experience} Years</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase mb-1">
                                        <Award className="w-3 h-3" /> Certifications
                                    </div>
                                    <p className="font-semibold text-gray-900">{careGiver.certifications?.length || 0}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" /> Bio
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {careGiver.bio || "No bio provided."}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-gray-400" /> Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {careGiver.skills?.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {(!careGiver.skills || careGiver.skills.length === 0) && (
                                        <span className="text-sm text-gray-500 italic">No specific skills listed.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No caregiver details found.
                        </div>
                    )}
                </div>
            </div>
        </ReactModal>
    );
};

export default CareGiverModal;