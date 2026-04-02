import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle, Info } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info" | "primary";
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {type === "danger" ? (
                    <div className="p-3 bg-red-100 rounded-2xl">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-100 rounded-2xl">
                      <Info className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              
              {message && <p className="text-gray-600 mb-10 leading-relaxed font-medium">{message}</p>}
              
              {children && <div className="mb-10">{children}</div>}
              
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
                {onConfirm && (
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`flex-1 px-6 py-3.5 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg ${
                      type === "danger"
                        ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                    }`}
                  >
                    {confirmText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
