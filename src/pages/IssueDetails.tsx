import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { ThumbsUp, MapPin, Calendar, User, Clock, AlertCircle, CheckCircle, ArrowLeft, Trash2, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
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
  status: "pending" | "in-progress" | "resolved" | "rejected";
  votes: number;
  createdAt: string;
  user_address: string;
  issue_location: string;
  pin_code: string;
  user_id?: {
    name: string;
  };
}

const IssueDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchIssue = async (retryCount = 10) => {
    setLoading(true);
    const attemptFetch = async (retries: number): Promise<void> => {
      try {
        const { data } = await api.get(`/issues/${id}`);
        setIssue(data);
      } catch (error: any) {
        if (error.isStarting && retries > 0) {
          console.log(`IssueDetails: Server starting, retrying in 5s... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return attemptFetch(retries - 1);
        }
        console.error("Error fetching issue:", error);
        setError(t('details.error_fetch'));
      }
    };

    await attemptFetch(retryCount);
    setLoading(false);
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
      toast.error(t('auth.login_required_vote') || "Please login to vote");
      return navigate("/login");
    }

    setVoting(true);
    try {
      await api.post(`/issues/${id}/vote`);
      setIssue(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
      toast.success(t('details.vote_success') || "Vote added successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to vote");
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
      showToast(t('details.status_updated', { status: t(`issues.status.${newStatus}`) }));
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
        <h2 className="text-2xl font-bold text-gray-900">{error || t('details.not_found')}</h2>
        <button onClick={() => navigate("/issues")} className="mt-4 text-blue-600 font-medium">
          {t('details.back')}
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
        {t('details.back')}
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
                  {t(`issues.category.${issue.category}`, { defaultValue: issue.category })}
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
                    <span>{issue.votes} {t('details.votes')}</span>
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                      title={t('details.delete')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center text-gray-500 text-sm">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{issue.user_id?.name || t('issues.anonymous')}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{t('details.location')}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="capitalize">{t(`issues.status.${issue.status}`)}</span>
                </div>
              </div>

              <div className="prose prose-blue max-w-none mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('details.description')}</h3>
                <p className="text-gray-600 leading-relaxed">{issue.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Issue Location</h4>
                  <p className="text-gray-900 font-medium">{issue.issue_location}</p>
                  <p className="text-sm text-gray-500 mt-1">Pin Code: {issue.pin_code}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reporter Address</h4>
                  <p className="text-gray-700 text-sm italic">{issue.user_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Controls */}
          {user?.role === "admin" && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                  {t('details.admin_only')}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
                {t('details.admin_controls')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleStatusUpdate("pending")}
                  className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                    issue.status === "pending" 
                      ? "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Clock className="h-5 w-5" />
                  <span>{t('details.set_pending')}</span>
                </button>
                <button
                  onClick={() => handleStatusUpdate("in-progress")}
                  className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                    issue.status === "in-progress" 
                      ? "bg-blue-100 text-blue-800 ring-2 ring-blue-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>{t('details.set_progress')}</span>
                </button>
                <button
                  onClick={() => handleStatusUpdate("resolved")}
                  className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                    issue.status === "resolved" 
                      ? "bg-green-100 text-green-800 ring-2 ring-green-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{t('details.set_resolved')}</span>
                </button>
                <button
                  onClick={() => handleStatusUpdate("rejected")}
                  className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                    issue.status === "rejected" 
                      ? "bg-red-100 text-red-800 ring-2 ring-red-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>{t('details.reject')}</span>
                </button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-100">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-bold text-red-600 hover:bg-red-50 transition-all border border-red-100"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>{t('details.delete')}</span>
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
                {t('details.location')}
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
                {t('details.coordinates')}: {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
            <h3 className="text-xl font-bold mb-4">{t('details.status_title')}</h3>
            <div className="flex items-center space-x-4 mb-6">
              {issue.status === "pending" && <Clock className="h-12 w-12" />}
              {issue.status === "in-progress" && <AlertCircle className="h-12 w-12" />}
              {issue.status === "resolved" && <CheckCircle className="h-12 w-12" />}
              {issue.status === "rejected" && <AlertTriangle className="h-12 w-12" />}
              <div>
                <p className="text-blue-100 text-sm uppercase tracking-widest font-bold">{t('issues.status_label')}</p>
                <p className="text-2xl font-bold capitalize">{t(`issues.status.${issue.status}`)}</p>
              </div>
            </div>
            <p className="text-blue-100 text-sm">
              {issue.status === "pending" && t('details.status_desc_pending')}
              {issue.status === "in-progress" && t('details.status_desc_progress')}
              {issue.status === "resolved" && t('details.status_desc_resolved')}
              {issue.status === "rejected" && t('issues.status.rejected')}
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('details.delete_confirm_title')}
        message={t('details.delete_confirm_msg')}
        confirmText={t('details.delete_confirm_btn')}
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
