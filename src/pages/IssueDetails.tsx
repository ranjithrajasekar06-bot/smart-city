import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { ThumbsUp, MapPin, Calendar, User, Clock, AlertCircle, CheckCircle, ArrowLeft, Trash2, CheckCircle2, TrendingUp, AlertTriangle, Share2, Twitter, Facebook, Mail, Copy, ExternalLink, ArrowRight } from "lucide-react";
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
  status: string;
  severity: "low" | "medium" | "high" | "critical";
  urgency: "low" | "medium" | "high" | "critical";
  keywords: string[];
  votes: number;
  createdAt: string;
  user_address: string;
  issue_location: string;
  pin_code: string;
  rating?: number;
  rating_comment?: string;
  user_id?: {
    _id?: string;
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
  const [rating, setRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
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

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRating(true);
    try {
      const { data } = await api.post(`/issues/${id}/rate`, {
        rating,
        rating_comment: ratingComment,
      });
      setIssue(data);
      toast.success(t('rating.success') || "Feedback submitted! Thank you.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-slate-500 hover:text-blue-600 mb-6 md:mb-10 transition-all font-black text-xs uppercase tracking-widest group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        {t('details.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8 md:space-y-12">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="relative h-[300px] md:h-[500px]">
              <img
                src={issue.image_url}
                alt={issue.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 md:top-6 left-4 md:left-6">
                <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] md:text-xs uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-black shadow-lg">
                  {t(`issues.category.${issue.category}`, { defaultValue: issue.category })}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 md:mb-10 gap-6">
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">{issue.title}</h1>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <button
                    onClick={handleVote}
                    disabled={voting}
                    className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-blue-100 transition-all shadow-lg shadow-blue-50 active:scale-95 disabled:opacity-50"
                  >
                    <ThumbsUp className={`h-4 w-4 md:h-5 md:w-5 ${voting ? "animate-bounce" : ""}`} />
                    <span>{issue.votes} <span className="hidden xs:inline">{t('details.votes')}</span></span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 md:px-6 py-3 md:py-4 text-slate-600 bg-slate-50 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                    title={t('details.share_title')}
                  >
                    <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{t('details.share_button')}</span>
                  </button>

                  {(user?.role === "admin" || user?.role === "super_admin") && (
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-3 md:p-4 text-red-600 bg-red-50 rounded-xl md:rounded-2xl hover:bg-red-100 transition-all active:scale-95"
                      title={t('details.delete')}
                    >
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12 p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporter</span>
                  <div className="flex items-center text-slate-900 font-bold text-xs md:text-sm truncate">
                    <User className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-blue-500 shrink-0" />
                    <span className="truncate">{issue.user_id?.name || t('issues.anonymous')}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reported On</span>
                  <div className="flex items-center text-slate-900 font-bold text-xs md:text-sm">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-blue-500 shrink-0" />
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                  <div className="flex items-center text-slate-900 font-bold text-xs md:text-sm">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-blue-500 shrink-0" />
                    <span className="capitalize truncate">{t(`issues.status.${issue.status}`)}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</span>
                  <div className="flex items-center text-slate-900 font-bold text-xs md:text-sm">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-blue-500 shrink-0" />
                    <span className="truncate">{t('details.location')}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8 md:mb-12">
                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-3 md:mb-4">{t('details.description')}</h3>
                <p className="text-slate-600 leading-relaxed text-base md:text-lg font-medium">{issue.description}</p>
              </div>

              {/* NLP Analysis Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl border-2 border-slate-50 shadow-sm">
                  <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                    <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${
                      issue.severity === 'high' ? 'bg-red-100 text-red-600' : 
                      issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</span>
                  </div>
                  <p className="text-xl md:text-2xl font-black text-slate-900 capitalize">{issue.severity}</p>
                </div>

                <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl border-2 border-slate-50 shadow-sm">
                  <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                    <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${
                      issue.urgency === 'critical' ? 'bg-red-100 text-red-600 animate-pulse' :
                      issue.urgency === 'high' ? 'bg-red-100 text-red-600' : 
                      issue.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</span>
                  </div>
                  <p className="text-xl md:text-2xl font-black text-slate-900 capitalize">{issue.urgency}</p>
                </div>

                <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-3xl border-2 border-slate-50 shadow-sm">
                  <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                    <div className="p-2 md:p-3 bg-purple-100 text-purple-600 rounded-xl md:rounded-2xl">
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Keywords</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {issue.keywords && issue.keywords.length > 0 ? issue.keywords.map((kw, idx) => (
                      <span key={idx} className="text-[8px] md:text-[10px] bg-purple-50 text-purple-700 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg font-black uppercase tracking-wider">
                        {kw}
                      </span>
                    )) : <span className="text-xs md:text-sm text-slate-400 italic">None detected</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8 bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] text-white">
                <div>
                  <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3">Issue Location</h4>
                  <p className="text-lg md:text-xl font-black">{issue.issue_location}</p>
                  <div className="mt-3 md:mt-4 flex items-center text-slate-400 text-xs md:text-sm font-bold">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    Pin Code: {issue.pin_code}
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3">Reporter Address</h4>
                  <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed italic">"{issue.user_address}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Satisfaction Feedback Rating */}
          {(() => {
            const isReporter = !!(user && (
              (typeof issue.user_id === "string" && issue.user_id === user._id) ||
              (typeof issue.user_id === "object" && issue.user_id !== null && ((issue.user_id as any)._id === user._id || (issue.user_id as any)._id === user?.toString())) ||
              (issue as any).user_id?._id === user._id
            ));

            return issue.status === "resolved" ? (
              <div className="bg-gradient-to-[135deg] from-green-50/70 to-emerald-50/70 border border-green-200/60 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm overflow-hidden">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 md:mr-3 text-green-600" />
                  {t('rating.title', { defaultValue: 'Citizen Satisfaction Feedback' })}
                </h3>
                <p className="text-slate-500 text-xs md:text-sm font-bold mb-6 uppercase tracking-wider">
                  {t('rating.subtitle', { defaultValue: 'TAMIL NADU SMART GOVERNANCE RESOLUTION SATISFACTION (மக்கள் திருப்தி மதிப்பீடு)' })}
                </p>

                {issue.rating ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">{t('rating.score_label', { defaultValue: 'Citizen Rating' })}:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-2xl md:text-3xl ${
                            star <= (issue.rating ?? 0) ? "text-amber-400 font-bold" : "text-slate-200"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="ml-3 font-semibold text-sm text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-100">
                        {issue.rating}/5
                      </span>
                    </div>
                    {issue.rating_comment && (
                      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-green-100 italic font-medium text-slate-600 text-sm md:text-base">
                        "{issue.rating_comment}"
                      </div>
                    )}
                  </div>
                ) : isReporter ? (
                  <form onSubmit={handleSubmitRating} className="space-y-5">
                    <div className="flex flex-col space-y-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('rating.select_stars', { defaultValue: 'Choose Rating Stars (நட்சத்திரங்கள்)' })}</span>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-3xl md:text-4xl transition-all hover:scale-125 focus:outline-none cursor-pointer ${
                              star <= rating ? "text-amber-400 font-bold" : "text-slate-300"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="ratingComment" className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {t('rating.comment_label', { defaultValue: 'Satisfaction Comments (நிறை/குறை கருத்துகள்)' })}
                      </label>
                      <textarea
                        id="ratingComment"
                        rows={3}
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder={t('rating.comment_placeholder', { defaultValue: 'How was the resolution speed and quality? Tell us...' })}
                        className="w-full px-4 py-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl md:rounded-2xl bg-white text-slate-700 font-medium text-sm resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingRating}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-xs md:text-sm uppercase tracking-widest px-6 py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
                    >
                      {isSubmittingRating ? t('submitting') : t('submit')}
                    </button>
                  </form>
                ) : (
                  <div className="text-slate-500 italic text-sm font-medium bg-white/60 p-4 rounded-2xl border border-slate-100">
                    {t('rating.awaiting_citizen', { defaultValue: 'Awaiting satisfaction rating from the citizen reporter.' })}
                  </div>
                )}
              </div>
            ) : null;
          })()}

          {/* Admin Controls */}
          {(user?.role === "admin" || user?.role === "super_admin") && (
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 md:p-6">
                <div className="bg-blue-600 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl shadow-lg shadow-blue-200">
                  {user?.role === "super_admin" ? "Super Admin" : t('details.admin_only')}
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1 flex items-center">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3 text-blue-600" />
                {t('details.admin_controls')}
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-6 md:mb-8 uppercase tracking-wider">
                {user?.role === "super_admin" 
                  ? "Global Moderator Overrides • Super Administrator Privileges" 
                  : `Departmental Scope • ${user?.department || "General"} Operations`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {[
                  { status: "pending", icon: Clock, color: "yellow", label: t('details.set_pending') },
                  { status: "in-progress", icon: TrendingUp, color: "blue", label: t('details.set_progress') },
                  { status: "resolved", icon: CheckCircle2, color: "green", label: t('details.set_resolved') },
                  { status: "rejected", icon: AlertTriangle, color: "red", label: t('details.reject') },
                ].map((btn) => (
                  <button
                    key={btn.status}
                    onClick={() => openStatusModal(btn.status as Issue["status"])}
                    className={`flex items-center justify-center space-x-3 px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all active:scale-95 ${
                      issue.status === btn.status 
                        ? `bg-${btn.color}-600 text-white shadow-xl shadow-${btn.color}-200 ring-4 ring-${btn.color}-100` 
                        : `bg-slate-50 text-slate-600 hover:bg-${btn.color}-50 hover:text-${btn.color}-600`
                    }`}
                  >
                    <btn.icon className="h-4 w-4 md:h-5 md:w-5" />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 md:mt-10 pt-8 md:pt-10 border-t border-slate-100">
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full flex items-center justify-center space-x-3 px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all border-2 border-red-50 active:scale-95"
                >
                  <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                  <span>{t('details.delete')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8 md:space-y-12">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-50">
              <h3 className="font-black text-slate-900 flex items-center uppercase tracking-widest text-[10px] md:text-xs">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-blue-600" />
                {t('details.location')}
              </h3>
            </div>
            <div className="h-64 md:h-80 relative">
              <MapContainer center={[issue.latitude, issue.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[issue.latitude, issue.longitude]} />
              </MapContainer>
              <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
                <div className="bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/50 shadow-lg text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {t('details.coordinates')}
                  </p>
                  <p className="text-slate-900 font-bold text-[10px] md:text-xs">
                    {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 md:-mt-8 -mr-6 md:-mr-8 h-24 md:h-32 w-24 md:w-32 bg-white/10 rounded-full blur-2xl" />
            <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 tracking-tight">{t('details.status_title')}</h3>
            <div className="flex items-center space-x-4 md:space-x-6 mb-6 md:mb-8">
              <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/30">
                {issue.status === "pending" && <Clock className="h-8 w-8 md:h-10 md:w-10" />}
                {issue.status === "in-progress" && <AlertCircle className="h-8 w-8 md:h-10 md:w-10" />}
                {issue.status === "resolved" && <CheckCircle className="h-8 w-8 md:h-10 md:w-10" />}
                {issue.status === "rejected" && <AlertTriangle className="h-8 w-8 md:h-10 md:w-10" />}
              </div>
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-200 mb-1">{t('details.current_status')}</p>
                <p className="text-xl md:text-2xl font-black capitalize">{t(`issues.status.${issue.status}`)}</p>
              </div>
            </div>
            <p className="text-blue-100 text-xs md:text-sm font-medium leading-relaxed">
              {issue.status === "pending" && t('home.status_pending_desc')}
              {issue.status === "in-progress" && t('home.status_progress_desc')}
              {issue.status === "resolved" && t('home.status_resolved_desc')}
              {issue.status === "rejected" && "This issue has been reviewed and rejected by the city administration."}
            </p>
          </div>
        </div>
      </div>

      {/* Related Issues Section */}
      {relatedIssues.length > 0 && (
        <div className="mt-32">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-blue-600 font-black uppercase tracking-widest text-sm mb-4">Discovery</h2>
              <p className="text-4xl font-black text-slate-900">Related Reports</p>
            </div>
            <Link to="/issues" className="hidden sm:flex items-center text-blue-600 font-black hover:text-blue-700 transition-colors group">
              View All <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedIssues.map((relatedIssue) => (
              <motion.div
                key={relatedIssue._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 group"
              >
                <Link to={`/issues/${relatedIssue._id}`}>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={relatedIssue.image_url}
                      alt={relatedIssue.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                        {t(`issues.category.${relatedIssue.category}`, { defaultValue: relatedIssue.category })}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-xl font-black text-slate-900 mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">{relatedIssue.title}</h4>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center text-slate-400 text-xs font-bold">
                        <ThumbsUp className="h-4 w-4 mr-1.5 text-blue-500" />
                        {relatedIssue.votes}
                      </div>
                      <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        relatedIssue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        relatedIssue.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t(`issues.status.${relatedIssue.status}`)}
                      </div>
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
