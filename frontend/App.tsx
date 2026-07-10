/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Login from './components/Login.tsx';
import StudentDashboard from './components/StudentDashboard.tsx';
import HODDashboard from './components/HODDashboard.tsx';
import GuardDashboard from './components/GuardDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import TeacherDashboard from './components/TeacherDashboard.tsx';
import { getAuthToken, getAuthUser, getAuthRole, removeAuthToken } from './lib/api.js';
import { UserRole } from './types.js';

/**
 * Vance GatePass Portal - Main Application Component
 * 
 * Explain to your teacher: "This is the single-view entry point of the React SPA. It is responsible for:
 * 1. Restoring user session tokens from localStorage upon page refresh (maintaining state).
 * 2. Serving as the master router, dynamically rendering the correct portal (Student, HOD, Guard, or Admin)
 *    based on the authenticated user's role."
 */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Lifecyle hook to check active session on app startup
  useEffect(() => {
    const token = getAuthToken();
    const savedUser = getAuthUser();
    const savedRole = getAuthRole();

    if (token && savedUser && savedRole) {
      setUser(savedUser);
      setRole(savedRole as UserRole);
    }
    setLoading(false);
  }, []);

  // Callback triggered upon successful login
  const handleLoginSuccess = (loggedInUser: any, userRole: UserRole) => {
    setUser(loggedInUser);
    setRole(userRole);
  };

  // Callback to destroy session and log out
  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setRole(null);
  };

  // Loading state showing elegant modern spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
         <p className="mt-4 text-sm font-semibold text-slate-500">Initializing secure session...</p>
      </div>
    );
  }

  // If no authenticated user session exists, redirect to Login form
  if (!role || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Role-Based Router rendering secure views
  switch (role) {
    case 'student':
      return <StudentDashboard user={user} onLogout={handleLogout} />;
    case 'hod':
      return <HODDashboard user={user} onLogout={handleLogout} />;
    case 'guard':
      return <GuardDashboard user={user} onLogout={handleLogout} />;
    case 'admin':
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    case 'teacher':
      return <TeacherDashboard user={user} onLogout={handleLogout} />;
    default:
      return <Login onLoginSuccess={handleLoginSuccess} />;
  }
}

