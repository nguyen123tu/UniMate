import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboard';
import { taskService } from '../services/task';
import type { DashboardStats } from '../types';
import { Book, CheckSquare, LogOut, CalendarDays, CheckCircle, Clock, AlertTriangle, AlertCircle, ArrowRight, Loader2, Play } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import NotificationBell from '../components/NotificationBell';

export default function Dashboard() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickComplete = async (taskId: string) => {
    try {
      await taskService.patch(taskId, { status: 'COMPLETED' });
      toast.success('Đã hoàn thành công việc!');
      loadStats(); // Reload dashboard
    } catch (e) {
      toast.error('Có lỗi xảy ra');
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const chartData = stats.subjects.map(s => ({
    name: s.name,
    completed: s.completed_tasks,
    pending: s.total_tasks - s.completed_tasks,
    color: s.color || '#6366f1'
  }));

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Tổng quan tình hình học tập và công việc</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
            >
              <LogOut size={18} /> <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Quá hạn</p>
              <h3 className="text-3xl font-bold text-red-600">{stats.deadlines.overdue}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-xl text-red-500"><AlertCircle size={28} /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Hôm nay</p>
              <h3 className="text-3xl font-bold text-blue-600">{stats.deadlines.due_today}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-blue-500"><AlertTriangle size={28} /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Đang làm</p>
              <h3 className="text-3xl font-bold text-orange-500">{stats.status.in_progress}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl text-orange-500"><Clock size={28} /></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Hoàn thành</p>
              <h3 className="text-3xl font-bold text-green-600">{stats.status.completed}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-green-500"><CheckCircle size={28} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Charts & Demanding Subject */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Khối lượng công việc theo môn</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="completed" name="Hoàn thành" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="pending" name="Chưa xong" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu môn học</div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/tasks" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors flex flex-col items-center gap-2 text-center group">
                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform"><CheckSquare size={24} /></div>
                <span className="font-medium text-gray-700 text-sm">Tasks</span>
              </Link>
              <Link to="/subjects" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 transition-colors flex flex-col items-center gap-2 text-center group">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform"><Book size={24} /></div>
                <span className="font-medium text-gray-700 text-sm">Môn học</span>
              </Link>
              <Link to="/timetable" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-300 transition-colors flex flex-col items-center gap-2 text-center group">
                <div className="bg-orange-50 p-3 rounded-xl text-orange-600 group-hover:scale-110 transition-transform"><CalendarDays size={24} /></div>
                <span className="font-medium text-gray-700 text-sm">Lịch học</span>
              </Link>
              <Link to="/pomodoro" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-red-300 transition-colors flex flex-col items-center gap-2 text-center group">
                <div className="bg-red-50 p-3 rounded-xl text-red-600 group-hover:scale-110 transition-transform"><Play size={24} /></div>
                <span className="font-medium text-gray-700 text-sm">Pomodoro</span>
              </Link>
            </div>
            
          </div>

          {/* Priority Sidebar */}
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                Cần làm hôm nay
                <Link to="/tasks?view=today" className="text-xs text-indigo-600 font-medium hover:underline flex items-center">Xem tất cả <ArrowRight size={14} /></Link>
              </h3>
              
              <div className="space-y-3">
                {stats.priority_lists.today.length === 0 ? (
                  <p className="text-gray-400 text-sm italic text-center py-4">Tuyệt vời! Không có việc gì tồn đọng hôm nay.</p>
                ) : (
                  stats.priority_lists.today.map(task => (
                    <div key={task.id} className="p-3 border rounded-xl flex items-start gap-3 hover:border-indigo-200 transition-colors group">
                      <button onClick={() => handleQuickComplete(task.id)} className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors">
                        <CheckCircle size={20} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        {task.deadline && <p className="text-xs text-blue-600">{format(new Date(task.deadline), 'HH:mm', { locale: vi })}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
              <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center justify-between">
                Đã quá hạn
                <Link to="/tasks?view=overdue" className="text-xs text-red-500 font-medium hover:underline flex items-center">Xem tất cả <ArrowRight size={14} /></Link>
              </h3>
              
              <div className="space-y-3">
                {stats.priority_lists.overdue.length === 0 ? (
                  <p className="text-gray-400 text-sm italic text-center py-4">Bạn đang giữ phong độ rất tốt!</p>
                ) : (
                  stats.priority_lists.overdue.map(task => (
                    <div key={task.id} className="p-3 border border-red-100 bg-red-50/50 rounded-xl flex items-start gap-3 group">
                      <button onClick={() => handleQuickComplete(task.id)} className="mt-0.5 text-red-300 hover:text-green-500 transition-colors">
                        <CheckCircle size={20} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900 truncate">{task.title}</p>
                        {task.deadline && <p className="text-xs text-red-600 font-semibold">{format(new Date(task.deadline), 'dd/MM HH:mm', { locale: vi })}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
