import { useState, useEffect, useRef } from 'react';
import { Bell, X, Calendar, AlertTriangle, AlertCircle } from 'lucide-react';
import { notificationService } from '../services/notification';
import type { Notification } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load dismissed ids from local storage
    const stored = localStorage.getItem('dismissed_notifications');
    if (stored) {
      setDismissedIds(JSON.parse(stored));
    }
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
  };

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  const getIcon = (type: string) => {
    if (type === 'OVERDUE') return <AlertTriangle size={18} className="text-red-500" />;
    if (type === 'DUE_TODAY') return <Calendar size={18} className="text-orange-500" />;
    if (type === 'HIGH_PRIORITY') return <AlertCircle size={18} className="text-purple-500" />;
    return <Bell size={18} className="text-blue-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full relative transition-colors"
      >
        <Bell size={20} />
        {activeNotifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Thông báo</h3>
            <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              {activeNotifications.length} mới
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Bạn không có thông báo nào!</p>
              </div>
            ) : (
              activeNotifications.map(n => (
                <Link 
                  key={n.id}
                  to="/tasks"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors relative group"
                >
                  <div className="flex gap-3 items-start pr-6">
                    <div className="mt-0.5 p-1.5 rounded-full bg-white shadow-sm border border-gray-100">
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Hạn: {format(new Date(n.created_at), "HH:mm, dd/MM", { locale: vi })}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDismiss(n.id, e)}
                    className="absolute top-3 right-2 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Ẩn thông báo"
                  >
                    <X size={14} />
                  </button>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
