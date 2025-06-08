import React from 'react';
import { useAuth } from '../AuthContext';

export const DebugUserId: React.FC = () => {
  const { session } = useAuth();
  if (!import.meta.env.DEV) return null;
  return <div className="text-xs mt-2">User: {session?.user.id}</div>;
};
