import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { formatDate, getPriorityBadge, getStatusBadge } from '../../utils/helpers';
import { TaskDetailsModal } from '../../components/tasks/TaskDetailsModal';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    notStarted: 0,
    pendingOrInProgress: 0,
    completed: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/dashboard/stats');
      if (data.success) {
        setStats(data.stats);
        setRecentTasks(data.recentTasks || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch personal dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'My Assigned Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      link: '/employee/tasks',
    },
    {
      title: 'Not Started',
      value: stats.notStarted,
      icon: AlertCircle,
      color: 'bg-slate-100 text-slate-600 border-slate-300',
      link: '/employee/tasks?status=Not Started',
    },
    {
      title: 'In Progress / Pending',
      value: stats.pendingOrInProgress,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      link: '/employee/tasks?status=In Progress',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      link: '/employee/tasks?status=Completed',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Here is your current assignment overview and task status breakdown
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-white bg-slate-200/60 rounded-xl border border-slate-300 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/employee/tasks"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Go to My Tasks</span>
          </Link>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">
                  {loading ? (
                    <span className="inline-block w-8 h-8 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </span>
                <span className="text-xs text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                  View <ArrowRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* My Active Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Assignments</h3>
            <p className="text-xs text-slate-500">Your latest tasks that require attention or progress updates</p>
          </div>
          <Link
            to="/employee/tasks"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
          >
            All Assigned Tasks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading your tasks...</p>
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            You currently have no tasks assigned to you. Great job!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Task Title</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Updated</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTasks.map((task) => {
                  const priorityBadge = getPriorityBadge(task.priority);
                  const statusBadge = getStatusBadge(task.status);
                  return (
                    <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 max-w-sm truncate">{task.title}</p>
                        <p className="text-xs text-slate-400 max-w-sm truncate mt-0.5">
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
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(task.updatedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          View Details
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
