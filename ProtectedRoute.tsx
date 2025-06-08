import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
