import { useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import api from "../api/axios";

export default function UserDocumentsPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let storedUser = localStorage.getItem("user");
  let userId = "";
  try {
    userId = storedUser ? JSON.parse(storedUser)._id : "";
  } catch (err) {
    console.error("Invalid user data in localStorage", err);
  }

  useEffect(() => {
    if (!userId) {
      setError("Missing userId");
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/documents/user/${userId}`);
        setData(res.data || {});
      } catch (err) {
        console.error(err);
        setError(err.message || "Error fetching documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userId]);

  const handleDelete = async (docId) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      console.log("Delete request for:", docId);

      await api.delete(`/documents/${docId}`, {
        data: { userId },
      });

      const updatedData = {};
      for (const groupName in data) {
        updatedData[groupName] = data[groupName].filter(
          (doc) => doc._id !== docId
        );
        if (updatedData[groupName].length === 0) {
          delete updatedData[groupName];
        }
      }
      setData(updatedData);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document: " + error.message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-sm">Loading documents...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-sm">Error: {error}</p>
      </main>
    );
  }

  const groupNames = Object.keys(data);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Documents</h1>
          <p className="mt-2 text-gray-600 text-sm">
            Documents are grouped by family group.
          </p>
        </header>

        {groupNames.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents found.</p>
        ) : (
          <div className="space-y-6">
            {groupNames.map((groupName) => (
              <section
                key={groupName}
                className="bg-white shadow-sm rounded-xl p-4 border border-gray-100 space-y-2"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  {groupName}
                </h2>

                <ul className="relative space-y-4">
                  {data[groupName].map((doc) => (
                    <li
                      key={doc._id}
                      className="py-3 px-3 flex flex-col relative bg-white rounded-md shadow-sm border border-gray-50"
                    >
                      {/* DELETE ICON - top right */}
                      {doc.uploadedBy?._id === userId && (
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete document"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.originalName}
                        </p>

                        {doc.uploadedBy && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            uploaded by:{" "}
                            <span
                              className="font-medium text-gray-700 cursor-help underline decoration-dotted"
                              title={doc.uploadedBy.email}
                            >
                              {doc.uploadedBy.firstName}{" "}
                              {doc.uploadedBy.lastName}
                            </span>
                          </p>
                        )}
                      </div>

                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          View
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
