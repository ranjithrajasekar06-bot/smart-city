import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 50, x: "-50%" }}
      className={`fixed bottom-8 left-1/2 z-[110] flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border ${
        type === "success"
          ? "bg-green-50 border-green-100 text-green-800"
          : "bg-red-50 border-red-100 text-red-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-500" />
      )}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default Toast;
