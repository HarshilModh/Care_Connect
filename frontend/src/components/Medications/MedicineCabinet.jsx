import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import AddMedicationModal from "./AddMedicationModal";
import EditMedicationModal from "./EditMedicationModal";
import { useAuth } from "../../context/AuthContext";
import {
  Pill,
  CalendarClock,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Activity,
  Droplets,
  Edit,
} from "lucide-react";
import { toast } from "react-toastify";

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
      setMedications(response.data);

      const low = response.data.filter((m) => m.supplyCount < 5).length;
      setStats({ total: response.data.length, lowSupply: low });
    } catch (err) {
      console.error("Error fetching meds:", err);
      toast.error("Failed to load cabinet");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const membersRes = await api.get(`/memberships/group/${groupId}`, {
          withCredentials: true,
        });

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
        takenAt: new Date().toISOString(),
      });
      toast.success("Dose recorded! 💊");
      fetchMedications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to record dose");
    }
  };

  const handleDelete = async (medId) => {
    if (!window.confirm("Are you sure you want to delete this medication?"))
      return;

    try {
      await api.delete(`/medications/${medId}`, {
        data: { deleterId: user._id },
      });
      toast.success("Medication removed");
      fetchMedications();
    } catch (err) {
      console.error(err);

      if (err.response) {
        const status = err.response.status;
        const message =
          err.response.data?.error ||
          err.response.data?.message ||
          "Action not allowed";

        if (status === 403) {
          toast.error(message);
          return;
        }
      }

      toast.error("Failed to delete medication");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10 font-sans text-gray-900">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Medicine Cabinet
              </h1>
            </div>
            <p className="text-gray-500 ml-1">
              Manage prescriptions and track daily adherence.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-medium shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Medication
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Active Prescriptions
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>

          <div
            className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4 ${
              stats.lowSupply > 0 ? "border-red-100" : "border-gray-100"
            }`}
          >
            <div
              className={`p-3 rounded-xl ${
                stats.lowSupply > 0
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Status Attention
              </p>
              <p
                className={`text-2xl font-bold ${
                  stats.lowSupply > 0 ? "text-red-600" : ""
                }`}
              >
                {stats.lowSupply > 0
                  ? `${stats.lowSupply} Needs Refill`
                  : "All Good"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Medication Cards */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-24 text-gray-400">
            Loading...
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
            No medications added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {medications.map((med) => {
              const isLowSupply = med.supplyCount < 5;

              return (
                <div
                  key={med._id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 flex flex-col relative ${
                    isLowSupply
                      ? "border-l-4 border-l-red-500 border-gray-100"
                      : "border-gray-100 hover:border-blue-50 hover:shadow-lg"
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {med.name}
                      </h3>

                      <div className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs bg-gray-100">
                        {med.dosage}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMedicationId(med._id)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(med._id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mb-6 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4" />
                      {med.frequency.replace("_", " ")} • {med.timesPerDay}x
                      daily
                    </div>
                    <p>
                      For {med.recipientId.firstName} {med.recipientId.lastName}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-xs uppercase text-gray-400">
                        Remaining
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          isLowSupply ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {med.supplyCount}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTakeDose(med._id, med.supplyCount)}
                      className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2"
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
        isOpen={!!editingMedicationId}
        onClose={() => setEditingMedicationId(null)}
        onSuccess={fetchMedications}
        medicationId={editingMedicationId}
      />
    </div>
  );
};

export default MedicineCabinet;
