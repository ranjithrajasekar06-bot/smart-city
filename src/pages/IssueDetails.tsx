import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { ThumbsUp, MapPin, Calendar, User, Clock, AlertCircle, CheckCircle, ArrowLeft, Trash2, CheckCircle2, TrendingUp, AlertTriangle, Share2, Twitter, Facebook, Mail, Copy, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import Modal from "../components/Modal";
import { Link } from "react-router-dom";

import { useNotifications } from "../context/NotificationContext";

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  latitude: number;
  longitude: number;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  severity: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high" | "critical";
  keywords: string[];
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
  const [relatedIssues, setRelatedIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState<Issue["status"] | null>(null);
  const { user } = useAuth();
  const { socket } = useNotifications();
  const navigate = useNavigate();

  const fetchIssue = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/issues/${id}`);
      setIssue(data);
      fetchRelatedIssues(data);
    } catch (error: any) {
      console.error("Error fetching issue:", error);
      setError(t('details.error_fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleIssueUpdated = (updatedIssue: Issue) => {
      if (updatedIssue._id === id) {
        console.log("Real-time: Current issue updated", updatedIssue);
        setIssue(updatedIssue);
      }
    };

    const handleIssueDeleted = (deletedId: string) => {
      if (deletedId === id) {
        console.log("Real-time: Current issue deleted", deletedId);
        toast.error(t('details.deleted_alert') || "This issue has been deleted.");
        navigate("/issues");
      }
    };

    socket.on("issue:updated", handleIssueUpdated);
    socket.on("issue:deleted", handleIssueDeleted);

    return () => {
      socket.off("issue:updated", handleIssueUpdated);
      socket.off("issue:deleted", handleIssueDeleted);
    };
  }, [socket, id]);

  const fetchRelatedIssues = async (currentIssue: Issue) => {
    setLoadingRelated(true);
    try {
      // Fetch issues in the same category
      const { data } = await api.get(`/issues?category=${currentIssue.category}&limit=4`);
      // Filter out the current issue
      const filtered = data.filter((i: Issue) => i._id !== currentIssue._id).slice(0, 3);
      setRelatedIssues(filtered);
    } catch (err) {
      console.error("Error fetching related issues:", err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${t('details.share_title')}: ${issue?.title}`,
      text: `${t('details.share_desc')} ${issue?.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('details.share_copied'));
    setIsShareModalOpen(false);
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
      toast.error(err.response?.data?.message || "Failed to delete issue");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await api.put(`/issues/${id}/status`, { status: newStatus });
      fetchIssue();
      toast.success(t('details.status_updated', { status: t(`issues.status.${newStatus}`) }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const openStatusModal = (status: Issue["status"]) => {
    setStatusToUpdate(status);
    setIsStatusModalOpen(true);
  };

  const confirmStatusUpdate = () => {
    if (statusToUpdate) {
      handleStatusUpdate(statusToUpdate);
      setIsStatusModalOpen(false);
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

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-6 py-2.5 text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    title={t('details.share_title')}
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="font-bold">{t('details.share_button')}</span>
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

              {/* NLP Analysis Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`h-6 w-6 ${
                    issue.severity === 'high' ? 'text-red-500' : 
                    issue.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{issue.severity}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <TrendingUp className={`h-6 w-6 ${
                    issue.urgency === 'critical' ? 'text-red-600 animate-pulse' :
                    issue.urgency === 'high' ? 'text-red-500' : 
                    issue.urgency === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Urgency</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{issue.urgency}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-6 w-6 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keywords</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {issue.keywords && issue.keywords.length > 0 ? issue.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                          {kw}
                        </span>
                      )) : <span className="text-xs text-gray-400 italic">None</span>}
                    </div>
                  </div>
                </div>
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
                  onClick={() => openStatusModal("pending")}
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
                  onClick={() => openStatusModal("in-progress")}
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
                  onClick={() => openStatusModal("resolved")}
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
                  onClick={() => openStatusModal("rejected")}
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

      {/* Related Issues Section */}
      {relatedIssues.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Related Issues</h2>
            <Link to="/issues" className="text-blue-600 font-bold hover:underline flex items-center text-sm">
              View All <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedIssues.map((relatedIssue) => (
              <motion.div
                key={relatedIssue._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <Link to={`/issues/${relatedIssue._id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={relatedIssue.image_url}
                      alt={relatedIssue.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold">
                        {t(`issues.category.${relatedIssue.category}`, { defaultValue: relatedIssue.category })}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-1">{relatedIssue.title}</h4>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {relatedIssue.votes}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        relatedIssue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        relatedIssue.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t(`issues.status.${relatedIssue.status}`)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={t('details.share_title')}
      >
        <div className="space-y-6">
          <p className="text-gray-600 text-sm">{t('details.share_desc')}</p>
          
          <div className="grid grid-cols-3 gap-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${t('details.share_title')}: ${issue.title}`)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Twitter className="h-6 w-6 mb-2" />
              <span className="text-xs font-bold">{t('details.share_twitter')}</span>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors"
            >
              <Facebook className="h-6 w-6 mb-2" />
              <span className="text-xs font-bold">{t('details.share_facebook')}</span>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`${t('details.share_title')}: ${issue.title}`)}&body=${encodeURIComponent(`${t('details.share_desc')} ${window.location.href}`)}`}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Mail className="h-6 w-6 mb-2" />
              <span className="text-xs font-bold">{t('details.share_email')}</span>
            </a>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent text-xs text-gray-500 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={t('details.share_copy')}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={confirmStatusUpdate}
        title="Update Issue Status"
        message={`Are you sure you want to update the status of this issue to "${statusToUpdate ? t(`issues.status.${statusToUpdate}`) : ''}"? This will notify the reporter and all voters.`}
        confirmText="Update Status"
        type="primary"
      />

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
      </AnimatePresence>
    </div>
  );
};

export default IssueDetails;
