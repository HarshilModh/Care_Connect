import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Users,
  Shield,
  Heart,
  User,
  CheckCircle2,
  Clock,
  CalendarDays,
  MoreVertical,
  LayoutDashboard,
  Paperclip,
  Upload,
  Activity,
  LogOut,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import CareGiverModal from "./CareGiverModal";
import CareRecipentModal from "./CareRecipentModal";
import PanicButton from "../PanicButton";

const GroupDetails = () => {
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const userId = user?._id || null;
  let { groupId } = useParams();
  groupId = groupId.trim();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(null);
  const [selectedCareRecipientId, setSelectedCareRecipientId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [canEdit, setCanEdit] = useState(false);
  const [stats, setStats] = useState({
    admins: [],
    careGivers: [],
    careRecipients: [],
    others: [],
  });
  const getUserId = () => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser)._id : null;
    } catch (err) {
      console.error("Invalid user data in localStorage", err);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId) return;

      setLoading(true);
      try {
        const groupRes = await api.get(`/family-groups/group/${groupId}`);
        setGroup(groupRes.data);
        setCanEdit(groupRes.data.createdBy === userId);
        // 2. Fetch Members
        const membersRes = await api.get(`/memberships/group/${groupId}`);
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
        setMembers(membersData);

        // Process roles
        setStats({
          admins: membersData.filter(
            (m) => m.role === "admin" || m.role === "owner"
          ),
          careGivers: membersData.filter((m) => m.role === "careGiver"),
          careRecipients: membersData.filter((m) => m.role === "careRecipient"),
          others: membersData.filter(
            (m) =>
              !["admin", "owner", "careGiver", "careRecipient"].includes(m.role)
          ),
        });

        // 3. Fetch Tasks
        try {
          const tasksRes = await api.get(`/tasks/group/${groupId}`);
          setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
          console.log("Fetched tasks:", tasksRes.data);
        } catch (taskErr) {
          console.warn("Could not fetch tasks", taskErr);
        }
      } catch (err) {
        console.error("Error loading group details:", err);
        setError(err.message || "Failed to load group details");
        toast.error("Failed to load group details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  const ALLOWED_TYPES = ["image/", "application/pdf", "text/plain"];

  const handleDocumentUpload = async (event) => {
    const filesArray = Array.from(event.target.files || []); // <-- convert
    if (!filesArray.length) return;

    const invalid = filesArray.filter((file) => {
      return !ALLOWED_TYPES.some((type) =>
        type.endsWith("/") ? file.type.startsWith(type) : file.type === type
      );
    });

    if (invalid.length) {
      toast.error("Only PDF, image, and text files are allowed.");
      event.target.value = "";
      return;
    }

    const userId = getUserId();
    if (!userId) {
      toast.error("User not found. Please log in again.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("groupId", groupId);

    filesArray.forEach((file) => {
      formData.append("dataFiles", file);
    });

    // try {
    //   const response = await axios.post(
    //     "http://localhost:3000/api/documents/",
    //     formData,
    //     {
    //       headers: {
    //         "Content-Type": "multipart/form-data",
    //       },
    //       onUploadProgress: (progressEvent) => {
    //         if (!progressEvent.total) return;
    //         const percentCompleted = Math.round(
    //           (progressEvent.loaded * 100) / progressEvent.total
    //         );
    //         setUploadProgress(percentCompleted);
    //       },
    //     }
    //   );

    try {
      const response = await api.post(`/documents/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      if (response.data.success) {
        toast.success(
          `Successfully uploaded ${
            filesArray.length
          } document(s)! Document IDs: ${response.data.attachments.join(", ")}`
        );
        event.target.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload documents");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const initials = (user) => {
    if (!user?.firstName) return "?";
    return `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase();
  };
  // router.post("/:groupId/leave", requireAuth, async (req, res) => {
  //     try {
  //         const groupId = req.params.groupId;
  //         const userId = req.body.userId;
  //         if (!groupId) {
  //             return res.status(400).json({ error: 'Group ID is required' });
  //         }
  //         if (!userId) {
  //             return res.status(400).json({ error: 'User ID is required' });
  //         }
  //         if (!mongoose.Types.ObjectId.isValid(groupId)) {
  //             return res.status(400).json({ error: 'Invalid Group ID' });
  //         }
  //         if (!mongoose.Types.ObjectId.isValid(userId)) {
  //             return res.status(400).json({ error: 'Invalid User ID' });
  //         }
  //         const result = await leaveGroup(groupId, userId);
  //         res.status(200).json(result);
  //     } catch (error) {
  //         res.status(500).json({ error: error.message });
  //     }
  // });
  const handleLeaveGroup = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) {
      return;
    }
    try {
      const res = await api.post(`/memberships/${groupId}/leave`, { userId });
      if (res.data.success) {
        toast.success("You have left the group.");
        navigate("/family-groups");
      } else {
        toast.error(res.data.message || "Failed to leave the group.");
      }
    } catch (error) {
      console.error("Leave group error:", error);
      toast.error(error.response?.data?.error || "Failed to leave the group.");
    }
  };
  const MemberCard = ({ member, icon: Icon, colorClass, bgClass, onClick }) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all ${
        onClick ? "cursor-pointer hover:border-indigo-200" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${colorClass} font-bold text-sm shrink-0`}
      >
        {initials(member.userId)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {member.userId?.firstName} {member.userId?.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate capitalize">
          {member.role}
        </p>
      </div>
      <div className={`p-1.5 rounded-lg ${bgClass} ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );

  const TaskRow = ({ task }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl transition-colors">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              task.status === "completed"
                ? "text-gray-400 line-through"
                : "text-gray-900"
            }`}
          >
            {task.title}
          </p>
          {task.dueAt && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(task.dueAt).toLocaleDateString()}
            </p>
          )}
          {task.assignedTo && (
            <p className="text-xs text-gray-500 mt-0.5">
              Assigned to:{" "}
              <span className="font-medium">
                {task.assignedTo.firstName} {task.assignedTo.lastName}
              </span>
            </p>
          )}
          {task.recipientId && (
            <p className="text-xs text-gray-500 mt-0.5">
              For:{" "}
              <span className="font-medium">
                {task.recipientId.firstName} {task.recipientId.lastName}
              </span>
            </p>
          )}
          {task.status === "completed" && task.completedBy && (
            <p className="text-xs text-green-600 mt-0.5">
              Completed by:{" "}
              <span className="font-medium">
                {task.completedBy.firstName} {task.completedBy.lastName}
              </span>
            </p>
          )}
        </div>
      </div>
      <div
        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
          task.status === "completed"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {task.status || "Pending"}
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-gray-200 rounded-xl animate-pulse col-span-2"></div>
            <div className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !group) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Group not found</h2>
          <p className="text-gray-500 mt-2">
            {error ||
              "This group may have been deleted or you don't have access."}
          </p>
          <button
            onClick={() => navigate("/family-groups")}
            className="mt-4 btn-primary"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate("/family-groups")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </button>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-32 h-32 text-indigo-600 transform rotate-12 translate-x-8 -translate-y-8" />
            </div>

            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {group.name}
              </h1>
              <p className="text-gray-500 max-w-2xl">
                {group.description || "No description provided."}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{members.length}</span>{" "}
                  Members
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="font-semibold">{tasks.length}</span> Tasks
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        id="document-upload"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt"
                        onChange={handleDocumentUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <label
                        htmlFor="document-upload"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          uploading
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        Add Document
                      </label>
                    </div>

                    <p className="text-xs text-gray-500">
                      Allowed: PDF, images (JPG, PNG, etc.), TXT.
                    </p>
                  </div>
                </div>

                {uploading && (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-indigo-600 rounded-full animate-ping" />
                    </div>
                    <span>{uploadProgress}%</span>
                  </div>
                )}
                {canEdit && (
                  <button
                    onClick={() => navigate(`/groups/edit/${groupId}`)}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" /> Settings
                  </button>
                )}
                <div className="ml-2">
                  <PanicButton groupId={groupId} userId={userId} />
                </div>
                <button
                  onClick={() => navigate(`/medications/${groupId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm font-medium"
                >
                  <Paperclip className="w-4 h-4" /> Medicine Cabinet
                </button>
                <button
                  onClick={() => navigate(`/vitals/dashboard/${groupId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
                >
                  <Activity className="w-4 h-4" /> Vitals & Health
                </button>
                {/* admin cannot leave the group */}
                {!canEdit && (
                  <button
                    onClick={handleLeaveGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Leave Group
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-500" /> Recent
                  Tasks
                </h2>
                <button
                  onClick={() => navigate("/tasks")}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View My Tasks
                </button>
              </div>

              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks
                    .slice(0, 10)
                    .map((task) => <TaskRow key={task._id} task={task} />)
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">
                      No active tasks for this group.
                    </p>
                    <button
                      onClick={() => navigate("/tasks/create")}
                      className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      + Create Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" /> Care Recipients
              </h2>
              {stats.careRecipients.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {stats.careRecipients.map((m) => (
                    <MemberCard
                      key={m._id}
                      member={m}
                      icon={User}
                      colorClass="text-amber-600"
                      bgClass="bg-amber-50"
                      onClick={() => setSelectedCareRecipientId(m.userId._id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic p-4 bg-white rounded-xl border border-dashed border-gray-200">
                  No care recipients assigned.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" /> Care Givers
              </h2>
              {stats.careGivers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {stats.careGivers.map((m) => (
                    <MemberCard
                      key={m._id}
                      member={m}
                      icon={Heart}
                      colorClass="text-rose-600"
                      bgClass="bg-rose-50"
                      onClick={() => setSelectedCaregiverId(m.userId._id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic p-4 bg-white rounded-xl border border-dashed border-gray-200">
                  No care givers assigned.
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" /> Admins & Family
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {[...stats.admins, ...stats.others].map((m) => (
                  <MemberCard
                    key={m._id}
                    member={m}
                    icon={Shield}
                    colorClass="text-indigo-600"
                    bgClass="bg-indigo-50"
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        <CareGiverModal
          isOpen={!!selectedCaregiverId}
          onClose={() => setSelectedCaregiverId(null)}
          careGiverId={selectedCaregiverId}
        />
        <CareRecipentModal
          isOpen={!!selectedCareRecipientId}
          onClose={() => setSelectedCareRecipientId(null)}
          careRecipentId={selectedCareRecipientId}
          groupId={groupId}
        />
      </div>
    </main>
  );
};

export default GroupDetails;
