import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  CheckSquare,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  User,
  Send,
  Sparkles,
} from 'lucide-react';

export const CreateTaskPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedEmployee: '',
    priority: 'Medium',
    status: 'Not Started',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const data = await api.get('/employees');
        if (data.success) {
          // Filter only active employees
          const activeEmployees = (data.employees || []).filter(
            (e) => e.status === 'Active'
          );
          setEmployees(activeEmployees);
          if (activeEmployees.length > 0) {
            setFormData((prev) => ({
              ...prev,
              assignedEmployee: activeEmployees[0]._id,
            }));
          }
        }
      } catch (err) {
        setError('Failed to fetch employee list. Please ensure employees exist.');
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (!formData.title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Task description is required.');
      return;
    }
    if (!formData.assignedEmployee) {
      setError('Please select an employee to assign this task to.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/tasks', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedEmployee: formData.assignedEmployee,
        priority: formData.priority,
        status: formData.status,
      });

      if (res.success) {
        setSuccess(
          `Task "${res.task.title}" created! Email notification dispatched to ${res.task.assignedEmployee?.name}.`
        );
        // Reset form
        setFormData({
          title: '',
          description: '',
          assignedEmployee: employees[0]?._id || '',
          priority: 'Medium',
          status: 'Not Started',
        });
        setTimeout(() => {
          navigate('/admin/tasks');
        }, 1800);
      }
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Back link & Title */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/tasks"
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create & Assign Task
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create a new task, set delivery priority, and immediately notify the assignee via email
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Card Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Task Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Implement OAuth2 Refresh Token Strategy"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all font-medium"
              required
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Task Description *
            </label>
            <textarea
              rows={4}
              placeholder="Provide clear specifications, acceptance criteria, and objectives for the employee..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Grid: Employee, Priority, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Assigned Employee */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Assign To Employee *
              </label>
              {loadingEmployees ? (
                <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
              ) : employees.length === 0 ? (
                <div className="text-xs text-rose-600 p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  No active employees found. Please add an employee first.
                </div>
              ) : (
                <select
                  value={formData.assignedEmployee}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedEmployee: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Not Started">Not Started</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Email dispatch notice */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900">
              <p className="font-semibold">Automated Email Notification</p>
              <p className="text-indigo-700/80 mt-0.5">
                Submitting this task triggers Nodemailer to send a rich HTML notification email to the assigned employee with complete details and priority level.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/tasks')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || employees.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving & Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Create & Assign Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
