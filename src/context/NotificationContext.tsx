import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (user) {
      // Fetch initial notifications
      fetchNotifications();

      // Initialize socket
      const newSocket = io(window.location.origin);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to notification socket");
        newSocket.emit("join", user._id);
      });

      newSocket.on("notification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        toast.info(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      setNotifications([]);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

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

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
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
