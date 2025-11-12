import React, { useState } from "react";
// import { useNavigate } from "react-router-dom"; // enable when you want to route to Add Members

const CreateGroup = () => {
  // const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const createdBy = localStorage.getItem("userId") || "";

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
      const res = await fetch("/api/familyGroups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          groupName: groupName.trim(),
          description: description.trim(),
          isPublic,
          createdBy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create group");

      setMsg({ type: "success", text: "Group created successfully." });

      // Go to Add Members page with the groupId as prop
      navigate(`/addMember`, { state: { groupId: data.group._id } });
      // Keep the success visible briefly, then clear inputs
      setTimeout(() => resetForm(), 400);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Something went wrong." });
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
    </main>
  );
};

export default CreateGroup;
