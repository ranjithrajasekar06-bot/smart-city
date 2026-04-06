import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../services/api";
import { toast } from "sonner";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "status_change" | "resolved" | "nearby_issue";
  issue_id?: string;
  is_read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  socket: Socket | null;
  requestPermission: () => Promise<void>;
  permissionStatus: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default"
  );
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const playNotificationSound = useCallback(() => {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.4;
    audio.play().catch((e) => console.log("Audio play blocked by browser", e));
  }, []);

  const showBrowserNotification = useCallback((notification: Notification) => {
    if (Notification.permission === "granted" && document.hidden) {
      const n = new Notification(notification.title, {
        body: notification.message,
        icon: "/pwa-192x192.png",
      });
      n.onclick = () => {
        window.focus();
        if (notification.issue_id) {
          window.location.href = `/issues/${notification.issue_id}`;
        }
      };
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
  };

  useEffect(() => {
    // Initialize socket for everyone (even unauthenticated for public updates)
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      if (user) {
        newSocket.emit("join", user._id);
      }
    });

    if (user) {
      // Fetch initial notifications
      fetchNotifications();

      newSocket.on("notification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        
        // Play sound
        playNotificationSound();
        
        // Show browser notification
        showBrowserNotification(notification);

        // Special handling for urgent notifications
        if (notification.message.toLowerCase().includes("urgent") || notification.title.toLowerCase().includes("urgent")) {
          toast.error(notification.title, {
            description: notification.message,
            duration: 10000,
            action: notification.issue_id ? {
              label: "View",
              onClick: () => window.location.href = `/issues/${notification.issue_id}`
            } : undefined
          });
        } else {
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000,
            action: notification.issue_id ? {
              label: "View",
              onClick: () => window.location.href = `/issues/${notification.issue_id}`
            } : undefined
          });
        }
      });
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user, playNotificationSound, showBrowserNotification]);

  // Update location periodically if user is logged in
  useEffect(() => {
    if (user) {
      const updateLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                await api.put("/auth/location", {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              } catch (error) {
                console.error("Error updating location:", error);
              }
            },
            (error) => {
              console.error("Geolocation error:", error);
            }
          );
        }
      };

      updateLocation();
      const interval = setInterval(updateLocation, 300000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        socket,
        requestPermission,
        permissionStatus
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
