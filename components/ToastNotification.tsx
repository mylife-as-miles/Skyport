import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

const MotionDiv = motion.div as any;

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info';
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 5000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <MotionDiv
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      layout
      className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 border border-green-500/50 text-green-100 px-4 py-3 rounded shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-md min-w-[300px]"
    >
      <div className="p-1 bg-green-900/50 rounded-full border border-green-500/30">
        <CheckCircle className="w-4 h-4 text-green-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-0.5">Notification</p>
        <p className="text-sm font-mono">{toast.message}</p>
      </div>
      <button onClick={onRemove} className="text-slate-500 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </MotionDiv>
  );
};

interface ToastNotificationProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;