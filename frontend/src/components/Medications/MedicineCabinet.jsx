import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import AddMedicationModal from './AddMedicationModal';
import EditMedicationModal from './EditMedicationModal';
import { useAuth } from '../../context/AuthContext';
import {
  Pill,
  CalendarClock,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Activity,
  Droplets,
  Edit
} from 'lucide-react';
import { toast } from 'react-toastify';

const MedicineCabinet = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useAuth();
  const userData = localStorage.getItem("user") || "";
  const userId = JSON.parse(userData)._id || "";
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, lowSupply: 0 });
  const [editingMedicationId, setEditingMedicationId] = useState(null);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/medications/group/${groupId}`);
      console.log("Medications fetched:", response.data);
      setMedications(response.data);

      // Calculate stats
      const low = response.data.filter(m => m.supplyCount < 5).length;
      setStats({ total: response.data.length, lowSupply: low });

    } catch (err) {
      console.error("Error fetching meds:", err);
      toast.error('Failed to load cabinet');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

 useEffect(() => {
  const checkMembership = async () => {
    try {
      const membersRes = await api.get(
        `/memberships/group/${groupId}`,
        { withCredentials: true }
      );
      const membersData = Array.isArray(membersRes.data)
        ? membersRes.data
        : [];
      const isMember = membersData.some(
        (member) => member.userId._id === userId
      );
      if (!isMember) {
        toast.error("You are not a member of this group.", {
          toastId: "not-member-error",
        });
        navigate("/family-groups");
      }
    } catch (err) {
      console.error("Error checking group membership:", err);
      toast.error("Failed to verify group membership");
      navigate("/family-groups");
    }
  };

  checkMembership();
}, [groupId, userId, navigate]);

  useEffect(() => {
    
    fetchMedications();
  }, [fetchMedications]);

  const handleTakeDose = async (medId, currentSupply) => {
    if (currentSupply <= 0) {
      toast.warn("Supply is empty! Please refill.");
      return;
    }
    try {
      await api.post(`/medications/${medId}/record-dose`, {
        takenBy: user._id,
        takenAt: new Date().toISOString()
      });
      toast.success("Dose recorded! 💊");
      fetchMedications(); // Refresh to update supply count
    } catch (err) {
      console.error(err);
      toast.error("Failed to record dose");
    }
  };

  const handleDelete = async (medId) => {
    if (!window.confirm("Are you sure you want to delete this medication?")) return;
    try {
      await api.delete(`/medications/${medId}`, {
        data: { deleterId: user._id }
      });
      toast.success("Medication removed");
      fetchMedications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10 font-sans text-gray-900">
      
      {/* --- Header & Actions --- */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Medicine Cabinet
              </h1>
            </div>
            <p className="text-gray-500 ml-1">Manage prescriptions and track daily adherence.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            Add Medication
          </button>
        </div>

        {/* --- Stats Dashboard --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-100 transition-colors">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>

          <div className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-colors ${stats.lowSupply > 0 ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>
            <div className={`p-3 rounded-xl ${stats.lowSupply > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Status Attention</p>
              <p className={`text-2xl font-bold ${stats.lowSupply > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.lowSupply > 0 ? `${stats.lowSupply} Needs Refill` : 'All Good'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Grid Content --- */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Loading your cabinet...</p>
          </div>
        ) : medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Pill className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Cabinet is Empty</h3>
            <p className="text-gray-500 mt-1 mb-6 max-w-sm text-center">
              Add your first prescription to start tracking supply and dosage history.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
            >
              Add first medication
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {medications.map((med) => {
              const isLowSupply = med.supplyCount < 5;
              
              return (
                <div 
                  key={med._id} 
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-50 transition-all duration-300 group flex flex-col relative overflow-hidden"
                >
                  {/* Low Supply Indicator */}
                  {isLowSupply && (
                    <div className="absolute top-0 right-0 p-4">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                  )}

                  {/* Top: Header & Delete */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="pr-8">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {med.name}
                      </h3>
                      <div className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {med.dosage}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingMedicationId(med._id)}
                      className="text-gray-300 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors absolute top-4 right-12"
                      title="Edit Medication"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(med._id)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors absolute top-4 right-4"
                      title="Delete Medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Middle: Details */}
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50/50 p-2 rounded-lg">
                      <CalendarClock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700 capitalize">
                        {med.frequency.replace('_', ' ')}
                      </span>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-gray-400" />
                        <span>{med.timesPerDay}x daily</span>
                      </div>
                    </div>
                    
                    {med.instructions && (
                        <div>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 pl-1">
                        "{med.instructions}"
                      </p>
                    </div>
                    )}
                    <p className="ml-2 text-gray-400">For {med.recipientId.firstName} {med.recipientId.lastName}
                      </p>
                  </div>

                  {/* Bottom: Supply & Action */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Remaining</p>
                      <div className={`flex items-baseline gap-1 ${isLowSupply ? 'text-red-600' : 'text-gray-900'}`}>
                        <span className="text-2xl font-bold">{med.supplyCount}</span>
                        <span className="text-xs font-medium text-gray-500">pills</span>
                      </div>
                    </div>
                    {/* refildate */}
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Refill Date</p>
                      <span className="text-sm text-gray-700">
                        {new Date(med.refillDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleTakeDose(med._id, med.supplyCount)}
                      className="bg-black hover:bg-gray-800 text-white pl-3 pr-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Take Dose
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddMedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMedications}
      />
      <EditMedicationModal
        isOpen={!!editingMedicationId} // Placeholder for future edit functionality
        onClose={() => setEditingMedicationId(null)}
        onSuccess={fetchMedications}
        medicationId={editingMedicationId}
      />
    </div>
  );
};

export default MedicineCabinet;