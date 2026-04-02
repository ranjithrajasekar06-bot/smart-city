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
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {permissionStatus === "default" && (
                    <button
                      onClick={requestPermission}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Enable Desktop Notifications"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all
                    </button>
                  )}
                </div>
              </div>

              <div className="flex space-x-1">
                {["all", "status_change", "resolved", "nearby_issue"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-wider transition-all ${
                      filter === f 
                        ? "bg-blue-600 text-white" 
                        : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {f === "all" ? "All" : f.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {filter === "all" ? (
                    <>
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </>
                  ) : (
                    <>
                      <BellOff className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No {filter.replace("_", " ")} notifications</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`group p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start space-x-3 ${
                        !notification.is_read ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="mt-1" onClick={() => handleNotificationClick(notification)}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => handleNotificationClick(notification)}>
                        <p className={`text-sm ${!notification.is_read ? "font-bold text-gray-900" : "text-gray-700"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <Link 
                to="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center"
              >
                View all notifications
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
