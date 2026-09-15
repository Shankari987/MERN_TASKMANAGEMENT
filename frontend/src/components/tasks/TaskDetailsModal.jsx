import React from 'react';
import { X, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { formatDate, getPriorityBadge, getStatusBadge } from '../../utils/helpers';

export const TaskDetailsModal = ({ task, onClose }) => {
  if (!task) return null;

  const priorityStyle = getPriorityBadge(task.priority);
  const statusStyle = getStatusBadge(task.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityStyle.bg}`}>
              <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
              {task.priority} Priority
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
              {task.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{task.title}</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {task.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Assigned Employee */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">Assigned Employee</p>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {task.assignedEmployee?.name || 'Unassigned'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {task.assignedEmployee?.email || ''}
                </p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Created On</p>
                <p className="text-xs font-semibold text-slate-800">
                  {formatDate(task.createdAt)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Updated: {formatDate(task.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
