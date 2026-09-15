import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  CheckSquare,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';
import { formatDate, getPriorityBadge, getStatusBadge } from '../../utils/helpers';
import { TaskDetailsModal } from '../../components/tasks/TaskDetailsModal';

export const EmployeeTasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      params.append('limit', '100'); // Employee sees all their tasks

      setSearchParams(params);

      const res = await api.get(`/tasks?${params.toString()}`);
      if (res.success) {
        setTasks(res.tasks || []);
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to fetch assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [search, statusFilter, priorityFilter]);

  // Handle Status Update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      const res = await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.success) {
        showNotification(
          'success',
          `Status updated to "${newStatus}"! Email notification dispatched to Admin.`
        );
        // Refresh local task list
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
        );
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Assigned Tasks
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View details and update real-time progress for tasks assigned to you
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Admin receives instant email on status changes</span>
        </div>
      </div>

      {/* Global Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search within your tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="Not Started">Not Started</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {(search || statusFilter || priorityFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl whitespace-nowrap transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Task List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Retrieving assigned tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No tasks match your filter</p>
            <p className="text-xs text-slate-400 mt-1">
              You're completely up to date on your assignments!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Task Title & Details</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Assigned Date</th>
                  <th className="px-6 py-3.5">Update Status</th>
                  <th className="px-6 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const priorityBadge = getPriorityBadge(task.priority);
                  const isUpdating = updatingTaskId === task._id;

                  return (
                    <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 max-w-sm truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 max-w-sm truncate mt-0.5">
                          {task.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} />
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(task.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={task.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          {isUpdating && (
                            <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
