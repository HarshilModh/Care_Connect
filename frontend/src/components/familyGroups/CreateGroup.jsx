import React, { useState } from "react";
import axios from "axios";
// import { useNavigate } from "react-router-dom"; // enable when you want to route to Add Members
import { ToastContainer, toast } from 'react-toastify';

const CreateGroup = () => {
  // const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  let createdBy = localStorage.getItem("user") || "";

  
  createdBy = JSON.parse(createdBy)._id || "";

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setIsPublic(false);
    setMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!groupName.trim()) {
      setMsg({ type: "error", text: "Group name is required." });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/api/family-groups", {
        groupName: groupName.trim(),
        description: description.trim(),
        isPublic,
        createdBy,
      });
      console.log(response);
      
      const data = response.data;
      toast.success("Family group created successfully!");
      resetForm();
      
      // Optionally, navigate to Add Members page with the new group ID
      // navigate(`/addMember`, { state: { groupId: data.familyGroup._id } });
    } catch (err) {
      console.error("Error creating family group:", err);
      toast.error("Error creating family group: " + (err.response?.data?.error || err.message));
      setMsg({ type: "error", text: "Error creating family group: " + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="container-n">
        <header className="text-center mb-8">
          <h1 className="section-title">Create Family Group</h1>
          <p className="section-sub">Organize caregiving with a shared space for your family.</p>
        </header>

        <div className="card mx-auto max-w-2xl">
          <form className="card-pad form-grid" onSubmit={handleSubmit}>
            {/* Group name */}
            <div>
              <label className="card-sub font-semibold">Group Name</label>
            </div>
            <div>
              <div className={`floater ${groupName ? "filled" : ""}`}>
                <label className="float-label">Group name</label>
                <input
                  id="groupName"
                  className="input"
                  placeholder=" "
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="help">Pick a clear name that everyone will recognize.</p>
            </div>

            {/* Description */}
            <div>
              <label className="card-sub font-semibold">Description</label>
            </div>
            <div>
              <div className={`floater ${description ? "filled" : ""}`}>
                <label className="float-label">Description</label>
                <textarea
                  id="description"
                  className="textarea"
                  placeholder=" "
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="card-sub font-semibold">Visibility</label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                data-on={isPublic}
                className="switch"
                onClick={() => setIsPublic((v) => !v)}
              >
                <span className="switch-thumb" />
              </button>
              <span className="text-sm text-gray-700">
                Allow this group to be discoverable
              </span>
            </div>

            {/* Messages */}
            <div className="sm:col-span-2">
              {msg.type === "success" && <div className="alert-success">{msg.text}</div>}
              {msg.type === "error" && <div className="alert-error">{msg.text}</div>}
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn-ghost"
                onClick={resetForm}
                disabled={loading}
              >
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Creating…" : "Create Group"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          You can add members after creating the group.
        </p>
      </div>
            <ToastContainer
                      position="top-right"
                      autoClose={3000}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme="colored"
      
                  />
      
      
    </main>
  );
};

export default CreateGroup;
