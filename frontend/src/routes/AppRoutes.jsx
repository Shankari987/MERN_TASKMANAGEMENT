import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { AdminLayout } from '../layouts/AdminLayout';
import { EmployeeLayout } from '../layouts/EmployeeLayout';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { EmployeeManagement } from '../pages/admin/EmployeeManagement';
import { TaskManagement } from '../pages/admin/TaskManagement';
import { CreateTaskPage } from '../pages/admin/CreateTaskPage';
import { EmployeeDashboard } from '../pages/employee/EmployeeDashboard';
import { EmployeeTasksPage } from '../pages/employee/EmployeeTasksPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm font-medium">Initializing TaskMatrix...</p>
        </div>
      </div>
    );
  }

  // Root redirect logic
  const getRootRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={getRootRedirect()} />

      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="tasks" element={<TaskManagement />} />
        <Route path="tasks/create" element={<CreateTaskPage />} />
      </Route>

      {/* Employee Protected Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="tasks" element={<EmployeeTasksPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
