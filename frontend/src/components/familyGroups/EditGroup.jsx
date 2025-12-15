import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useParams, useNavigate } from "react-router-dom";
import { toast,ToastContainer } from 'react-toastify';
import { Users, Save, ArrowLeft, Globe, Lock } from 'lucide-react';
import { validateGroupName, validateDescription } from '../../utils/validation';

const EditGroup = () => {
  let { id } = useParams();
  id = id.trim();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await api.get(`/family-groups/group/${id}`);

        const userData = localStorage.getItem("user") || "";
        const userId = JSON.parse(userData)._id || "";

        // Check if user is a member of the group
        try {
        const membersRes = await api.get(
          `/memberships/group/${id}`,
          { withCredentials: true }
        );
        const membersData = Array.isArray(membersRes.data)
                  ? membersRes.data
                  : [];
                const isMember = membersData.some(
                  (member) => member.userId._id === userId
                );
                if (!isMember) {
                  // console.log("User is not a member of this group");
                  toast.error("You are not a member of this group.", {
                    toastId: "not-member-error",
                  });
                  navigate("/family-groups");
                }
      } catch (err) {
        console.error("Error checking group membership:", err);
        toast.error("Failed to verify group membership");
        navigate("/family-groups");
        return;
      }
        const group = response.data;
        setGroupName(group.groupName);
        setGroupDesc(group.description || "");
        setIsPublic(group.isPublic);
      } catch (error) {
        console.error("Error fetching group:", error);
        toast.error("Failed to load group details");
        navigate("/family-groups");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGroup();
    }
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) {
      toast.error("Invalid group ID");
      return;
    }
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
     if(!groupDesc.trim()){
      toast.error("Description is required");
      setSaving(false);
      return;
    }
    // Validate group name
    const nameError = validateGroupName(groupName);
    if (nameError) {
      toast.error(nameError);
      setSaving(false);
      return;
    }

   
    // Validate description if provided
    if (groupDesc && groupDesc.trim()) {
      const descError = validateDescription(groupDesc);
      if (descError) {
        toast.error(descError);
        return;
      }
    }

    setSaving(true);
    try {
      await api.put(`/family-groups/group/${id}`, {
        groupName,
        description: groupDesc,
        isPublic
      });
      toast.success("Group updated successfully");
      setTimeout(() => {
        navigate("/family-groups");
      }, 1000);
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error(error.response?.data?.error || "Failed to update group");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/family-groups")}
          className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to My Groups
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Edit Group</h2>
                <p className="text-indigo-100 mt-1">Update your group settings</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                placeholder="Enter group name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
                placeholder="What's this group about?"
              />
            </div>

            {/* <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isPublic ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="block font-medium text-gray-900">Public Group</span>
                    <span className="block text-sm text-gray-500">
                      {isPublic ? 'Anyone can find and join this group' : 'Only invited members can join'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <div className={`w-14 h-8 rounded-full transition-colors ${isPublic ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div> */}

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default EditGroup;