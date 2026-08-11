import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  toast: { type: 'success' | 'error'; message: string } | null;
}

export const ToastNotification: React.FC<Props> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
            : 'bg-red-900 text-red-100 border-red-700'
        }`}
      >
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
