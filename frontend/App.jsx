/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import HODDashboard from './components/HODDashboard';
import GuardDashboard from './components/GuardDashboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import PrincipalDashboard from './components/PrincipalDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import { getAuthToken, getAuthUser, getAuthRole, removeAuthToken } from './lib/api.js';

/**
 * Vance GatePass Portal - Main Application Component
 * 
 * Master router, dynamically rendering the correct portal (Student, HOD, Guard, or Admin)
 * based on the authenticated user's role.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Portal Error Boundary caught an exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Portal Session Error</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              A temporary rendering issue occurred. Please reset your session to continue.
            </p>
            <button
              onClick={() => {
                removeAuthToken();
                window.location.reload();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Reset Session & Log In
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainPortal />
    </ErrorBoundary>
  );
}

function MainPortal() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Theme state managed globally at app root level
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  // Apply theme class to HTML element whenever theme state changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Lifecycle hook to check active session on app startup
  useEffect(() => {
    const token = getAuthToken();
    const savedUser = getAuthUser();
    const savedRole = getAuthRole();

    if (token && savedUser && savedRole) {
      setUser(savedUser);
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  // Callback triggered upon successful login
  const handleLoginSuccess = (loggedInUser, userRole) => {
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center">
         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 dark:border-white"></div>
         <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Initializing secure session...</p>
      </div>
    );
  }

  // Resolve dashboard view contents
  let content;
  if (!role || !user) {
    content = <Login onLoginSuccess={handleLoginSuccess} />;
  } else {
    switch (role) {
      case 'student':
        content = <StudentDashboard user={user} onLogout={handleLogout} />;
        break;
      case 'hod':
        content = <HODDashboard user={user} onLogout={handleLogout} />;
        break;
      case 'guard':
        content = <GuardDashboard user={user} onLogout={handleLogout} />;
        break;
      case 'admin':
        content = <AdminDashboard user={user} onLogout={handleLogout} />;
        break;
      case 'teacher':
        content = <TeacherDashboard user={user} onLogout={handleLogout} />;
        break;
      case 'faculty':
        content = <FacultyDashboard user={user} onLogout={handleLogout} />;
        break;
      case 'principal':
        content = <PrincipalDashboard user={user} onLogout={handleLogout} />;
        break;
      default:
        content = <Login onLoginSuccess={handleLoginSuccess} />;
    }
  }

function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isVisible) setIsVisible(true);
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a') ||
          (target.classList && target.classList.contains('cursor-pointer')))
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const onMouseDown = () => setIsClicked(true);
    const onMouseUp = () => setIsClicked(false);
    const onMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="hidden sm:block">
      {/* Outer glowing ring */}
      <div
        className={`fixed top-0 left-0 pointer-events-none z-[99999] rounded-full transition-transform duration-100 ease-out border border-emerald-500/50 ${
          isHovered
            ? 'w-10 h-10 -ml-5 -mt-5 bg-emerald-500/15 backdrop-blur-[1px] scale-125 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'w-7 h-7 -ml-3.5 -mt-3.5 bg-emerald-500/5'
        } ${isClicked ? 'scale-75' : ''}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`
        }}
      />
      {/* Inner precision dot */}
      <div
        className={`fixed top-0 left-0 pointer-events-none z-[99999] w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] transition-transform duration-75 ${
          isHovered ? 'scale-150 bg-cyan-400 shadow-[0_0_12px_#06b6d4]' : ''
        }`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`
        }}
      />
    </div>
  );
}

  return (
    <div className="relative">
      {/* Custom Animated Interactive Cursor */}
      <CustomCursor />

      {/* Global Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 z-[9999] p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-md hover:scale-105 transition-all cursor-pointer"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Sun className="h-5 w-5 text-amber-400 animate-pulse" /> : <Moon className="h-5 w-5 text-slate-700" />}
      </button>

      {content}
    </div>
  );
}
