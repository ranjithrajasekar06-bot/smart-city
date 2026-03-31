import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useAuth } from "../context/AuthContext";
import { ThumbsUp, MapPin, Calendar, User, Clock, AlertCircle, CheckCircle, ArrowLeft, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Modal from "../components/Modal";
import Toast, { ToastType } from "../components/Toast";

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  latitude: number;
  longitude: number;
  status: "pending" | "in-progress" | "resolved";
  votes: number;
  createdAt: string;
  user_id?: {
    name: string;
  };
}

const IssueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchIssue = async () => {
    try {
      const { data } = await api.get(`/issues/${id}`);
      setIssue(data);
    } catch (error) {
      console.error("Error fetching issue:", error);
      setError("Could not find the requested issue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVote = async () => {
    if (!user) {
      return navigate("/login");
    }

    setVoting(true);
    try {
      await api.post(`/issues/${id}/vote`);
      fetchIssue();
      showToast("Vote recorded successfully!");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to vote", "error");
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/issues/${id}`);
      navigate("/issues");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete issue", "error");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await api.put(`/issues/${id}/status`, { status: newStatus });
      fetchIssue();
      showToast(`Status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{error || "Issue not found"}</h2>
        <button onClick={() => navigate("/issues")} className="mt-4 text-blue-600 font-medium">
          Back to Issues
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-96">
              <img
                src={issue.image_url}
                alt={issue.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-black/60 backdrop-blur-md text-white text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg font-bold">
                  {issue.category}
                </span>
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h1 className="text-3xl font-extrabold text-gray-900">{issue.title}</h1>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleVote}
                    disabled={voting}
                    className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp className={`h-5 w-5 ${voting ? "animate-bounce" : ""}`} />
                    <span>{issue.votes} Votes</span>
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                      title="Delete Issue"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center text-gray-500 text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{issue.user_id?.name || "Anonymous"}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Location Pinned</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="capitalize">{issue.status}</span>
                </div>
              </div>

              <div className="prose prose-blue max-w-none">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{issue.description}</p>
              </div>
            </div>
          </div>

          {/* Admin Controls */}
          {user?.role === "admin" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Authority Controls</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleStatusUpdate("pending")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    issue.status === "pending" ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-200" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Set Pending
                </button>
                <button
                  onClick={() => handleStatusUpdate("in-progress")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    issue.status === "in-progress" ? "bg-blue-100 text-blue-800 border-2 border-blue-200" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Set In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate("resolved")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    issue.status === "resolved" ? "bg-green-100 text-green-800 border-2 border-green-200" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Set Resolved
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Location
              </h3>
            </div>
            <div className="h-64">
              <MapContainer center={[issue.latitude, issue.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[issue.latitude, issue.longitude]} />
              </MapContainer>
            </div>
            <div className="p-4 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                Coordinates: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
            <h3 className="text-xl font-bold mb-4">Current Status</h3>
            <div className="flex items-center space-x-4 mb-6">
              {issue.status === "pending" && <Clock className="h-12 w-12" />}
              {issue.status === "in-progress" && <AlertCircle className="h-12 w-12" />}
              {issue.status === "resolved" && <CheckCircle className="h-12 w-12" />}
              <div>
                <p className="text-blue-100 text-sm uppercase tracking-widest font-bold">Status</p>
                <p className="text-2xl font-bold capitalize">{issue.status}</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm">
              {issue.status === "pending" && "This issue has been reported and is waiting for an authority to review it."}
              {issue.status === "in-progress" && "Authorities are currently working on resolving this issue."}
              {issue.status === "resolved" && "This issue has been marked as resolved by the city authorities."}
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Issue"
        message="Are you sure you want to delete this issue? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default IssueDetails;
