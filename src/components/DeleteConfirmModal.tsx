import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { ResourceItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  resource: ResourceItem | null;
  onClose: () => void;
  onConfirmDelete: (resourceId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  resource,
  onClose,
  onConfirmDelete
}) => {
  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-[#0D1117] border border-red-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Delete Resource?</h3>
              <p className="text-xs text-red-300/80">This action can be restored anytime</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to delete this resource from your roadmap?
          </p>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="text-xs font-bold text-white line-clamp-2">
              {resource.title}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
              {resource.url}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(resource.id)}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Resource</span>
          </button>
        </div>
      </div>
    </div>
  );
};
