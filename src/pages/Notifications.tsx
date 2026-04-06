import React, { useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Filter, 
  CheckSquare,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const Notifications: React.FC = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    unreadCount 
  } = useNotifications();
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <Info className="h-6 w-6 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "nearby_issue":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === "all" ? true : n.type === filter
  );

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    if (notification.issue_id) {
      navigate(`/issues/${notification.issue_id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-400 hover:text-slate-600 mb-3 transition-colors text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center tracking-tight">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-4 bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-lg shadow-blue-200">
                {unreadCount} New
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 w-full md:w-auto justify-center"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/30 flex items-center space-x-4 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center text-slate-400 mr-2 shrink-0">
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
          </div>
          {["all", "status_change", "resolved", "nearby_issue"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all shrink-0 ${
                filter === f 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-20 text-center text-gray-500"
              >
                <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-10 w-10 text-gray-200" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">All caught up!</h3>
                <p className="text-sm">No {filter === "all" ? "" : filter.replace("_", " ")} notifications found.</p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`group p-6 flex items-start space-x-4 transition-all hover:bg-gray-50/80 relative ${
                    !notification.is_read ? "bg-blue-50/20" : ""
                  }`}
                >
                  {!notification.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                  )}
                  
                  <div className="mt-1 p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-base ${!notification.is_read ? "font-extrabold text-gray-900" : "font-bold text-gray-700"}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${!notification.is_read ? "text-gray-800" : "text-gray-500"}`}>
                      {notification.message}
                    </p>
                    
                    <div className="mt-4 flex items-center space-x-4">
                      {notification.issue_id && (
                        <button className="text-xs font-bold text-blue-600 hover:underline">
                          View Issue Details
                        </button>
                      )}
                      {!notification.is_read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="text-xs font-bold text-gray-400 hover:text-blue-600"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete notification"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
