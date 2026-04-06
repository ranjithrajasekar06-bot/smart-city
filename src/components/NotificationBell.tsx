import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, Trash2, Settings, BellOff, ExternalLink } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate, Link } from "react-router-dom";

const NotificationBell: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    requestPermission, 
    permissionStatus 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "nearby_issue":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === "all" ? true : n.type === filter
  ).slice(0, 10); // Show only top 10 in dropdown

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    if (notification.issue_id) {
      navigate(`/issues/${notification.issue_id}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50"
          >
            <div className="p-5 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h3>
                <div className="flex items-center space-x-3">
                  {permissionStatus === "default" && (
                    <button
                      onClick={requestPermission}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Enable Desktop Notifications"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Mark all
                    </button>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                {["all", "status_change", "resolved", "nearby_issue"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[9px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest transition-all shrink-0 ${
                      filter === f 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                        : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    {f === "all" ? "All" : f.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[32rem] overflow-y-auto overscroll-contain">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  {filter === "all" ? (
                    <>
                      <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold">No notifications yet</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BellOff className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold">No {filter.replace("_", " ")} notifications</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`group p-5 hover:bg-slate-50 transition-all cursor-pointer flex items-start space-x-4 relative ${
                        !notification.is_read ? "bg-blue-50/20" : ""
                      }`}
                    >
                      {!notification.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                      )}
                      
                      <div className="mt-1 p-2 bg-white rounded-xl shadow-sm border border-slate-100" onClick={() => handleNotificationClick(notification)}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => handleNotificationClick(notification)}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm ${!notification.is_read ? "font-black text-slate-900" : "font-bold text-slate-600"}`}>
                            {notification.title}
                          </p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest shrink-0 ml-2">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${!notification.is_read ? "text-slate-700" : "text-slate-500"}`}>
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between self-stretch">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
              <Link 
                to="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 flex items-center justify-center transition-colors"
              >
                View all notifications
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
