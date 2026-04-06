import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ThumbsUp, Clock, AlertCircle, CheckCircle, ArrowRight, User, Layers, Info, Zap, ShieldAlert, Flame, Activity } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  severity: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high" | "critical";
  urgency_verified?: boolean;
  keywords: string[];
  votes: number;
  createdAt: string;
  user_id?: {
    name: string;
  };
}

interface IssueCardProps {
  issue: Issue;
  onVote: (e: React.MouseEvent, issueId: string) => void;
  votingId: string | null;
  onReportDuplicate?: (issueId: string) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onVote, votingId, onReportDuplicate }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 shadow-sm">
            <ShieldAlert className="h-3 w-3 mr-1.5" />
            {severity} Severity
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100 shadow-sm">
            <AlertCircle className="h-3 w-3 mr-1.5" />
            {severity} Severity
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
            <Info className="h-3 w-3 mr-1.5" />
            {severity} Severity
          </span>
        );
      default:
        return null;
    }
  };

  const getUrgencyBadge = (urgency: string, verified?: boolean) => {
    switch (urgency) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse">
            <Flame className="h-3 w-3 mr-1.5" />
            {urgency} Urgency
            {verified && <CheckCircle className="h-2.5 w-2.5 ml-1 text-white" />}
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 shadow-sm">
            <Zap className="h-3 w-3 mr-1.5" />
            {urgency} Urgency
            {verified && <CheckCircle className="h-2.5 w-2.5 ml-1 text-red-600" />}
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-100 shadow-sm">
            <Activity className="h-3 w-3 mr-1.5" />
            {urgency} Urgency
            {verified && <CheckCircle className="h-2.5 w-2.5 ml-1 text-yellow-700" />}
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100 shadow-sm">
            <Clock className="h-3 w-3 mr-1.5" />
            {urgency} Urgency
            {verified && <CheckCircle className="h-2.5 w-2.5 ml-1 text-green-600" />}
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-white shadow-sm">
            <Clock className="h-3 w-3 mr-1.5" />
            {t('issues.status.pending')}
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-500 text-white shadow-sm">
            <AlertCircle className="h-3 w-3 mr-1.5" />
            {t('issues.status.in-progress')}
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-500 text-white shadow-sm">
            <CheckCircle className="h-3 w-3 mr-1.5" />
            {t('issues.status.resolved')}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white shadow-sm">
            <AlertCircle className="h-3 w-3 mr-1.5" />
            {t('issues.status.rejected')}
          </span>
        );
      default:
        return null;
    }
  };

  const getEstimatedResolution = () => {
    if (issue.status === "resolved") return t('issues.resolution.completed') || "Completed";
    if (issue.status === "rejected") return t('issues.resolution.closed') || "Closed";

    // Base days based on severity
    let baseDays = 14;
    if (issue.severity === "high") baseDays = 3;
    else if (issue.severity === "medium") baseDays = 7;

    // Adjust for urgency
    if (issue.urgency === "critical") baseDays = Math.max(1, baseDays - 2);
    else if (issue.urgency === "high") baseDays = Math.max(1, baseDays - 1);

    // Adjust for status
    if (issue.status === "in-progress") baseDays = Math.max(1, baseDays - 1);

    const createdDate = new Date(issue.createdAt);
    const targetDate = new Date(createdDate.getTime() + baseDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    if (targetDate < now) {
      return (
        <span className="text-red-600 animate-pulse">
          {t('issues.resolution.soon') || "Resolving soon"}
        </span>
      );
    }

    const formattedDate = targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const isClose = (targetDate.getTime() - now.getTime()) < (2 * 24 * 60 * 60 * 1000);
    
    return (
      <span className={isClose ? "text-orange-600" : "text-slate-700"}>
        {t('issues.resolution.expected_by', { date: formattedDate }) || `Expected by ${formattedDate}`}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 group flex flex-col h-full"
    >
      <div className="relative h-64 overflow-hidden">
        <Link to={`/issues/${issue._id}`}>
          <img
            src={issue.image_url}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        </Link>
        <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
          {getStatusBadge(issue.status)}
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
            {t(`issues.category.${issue.category}`, { defaultValue: issue.category })}
          </span>
        </div>
      </div>

      <div className="p-8 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-2 mb-4">
          {getSeverityBadge(issue.severity)}
          {getUrgencyBadge(issue.urgency, issue.urgency_verified)}
        </div>
        <Link to={`/issues/${issue._id}`}>
          <h3 className="text-2xl font-black text-slate-900 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">{issue.title}</h3>
        </Link>
        <div className="relative">
          <p className={`text-slate-500 text-sm mb-6 font-medium leading-relaxed transition-all duration-300 ${isExpanded ? "" : "line-clamp-3"}`}>
            {issue.description}
          </p>
          {issue.description.length > 100 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline mb-4 block"
            >
              {isExpanded ? "Show Less" : "Read More"}
            </button>
          )}
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center text-slate-400">
              <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center mr-2">
                <User className="h-3 w-3 text-slate-500" />
              </div>
              <span>{t('issues.by')} {issue.user_id?.name || t('issues.anonymous')}</span>
            </div>
            <div className="flex items-center text-slate-400">
              <Clock className="h-3 w-3 mr-1.5" />
              <span>{formatDistanceToNow(new Date(issue.createdAt))} ago</span>
            </div>
          </div>

          <div className="flex items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <Info className="h-4 w-4 text-blue-500 mr-2" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Est. Resolution</span>
              <span className="text-xs font-bold leading-none">{getEstimatedResolution()}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => onVote(e, issue._id)}
              disabled={votingId === issue._id}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                votingId === issue._id 
                  ? "opacity-50 cursor-not-allowed" 
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95"
              }`}
              title={t('details.vote') || "Upvote"}
            >
              <ThumbsUp className={`h-4 w-4 ${votingId === issue._id ? "animate-bounce" : ""}`} />
              <span className="text-sm font-black">{issue.votes}</span>
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReportDuplicate?.(issue._id);
              }}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Report as Duplicate"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
          
          <Link 
            to={`/issues/${issue._id}`}
            className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center group-hover:translate-x-1 transition-transform"
          >
            {t('issues.details')}
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default IssueCard;
