import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Eye, CheckSquare, BellOff } from 'lucide-react';
import { gatepassService } from '../services/gatepassService.js';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const list = await gatepassService.getNotifications();
      setNotifications(list || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds for real-time alerts
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await gatepassService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await gatepassService.markNotificationRead(undefined, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 focus:outline-none hover:bg-slate-100 rounded-full transition-all duration-200"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 transform origin-top-right transition-all duration-300 ease-out">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-all"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="p-3 bg-slate-50 rounded-full text-slate-400 mb-2">
                  <BellOff className="w-6 h-6" />
                </div>
                <p className="text-slate-500 text-sm font-medium">No notifications yet</p>
                <p className="text-slate-400 text-xs mt-1">You'll receive live status alerts here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors ${!n.is_read ? 'bg-indigo-50/20' : ''
                    }`}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-slate-400 text-[10px] mt-1.5">
                      {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
