import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { pomodoroService } from '../services/pomodoro';
import { taskService } from '../services/task';
import type { Task } from '../types';
import { Play, Pause, RefreshCcw, Square, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_TIME = 25 * 60; // 25 minutes

export default function Pomodoro() {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');

  const [task, setTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);

  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    setLoadingTask(true);
    try {
      const found = await taskService.getById(taskId!);
      setTask(found);
    } catch (e) {
      console.error(e);
      toast.error('Không tìm thấy công việc');
    } finally {
      setLoadingTask(false);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      if (!startTime) {
        setStartTime(new Date());
        hasSavedRef.current = false;
      }
      
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (!hasSavedRef.current) {
        hasSavedRef.current = true;
        saveSession('COMPLETED');
        toast.success("Hết giờ! Bạn đã hoàn thành 1 Pomodoro.");
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, startTime]);

  const saveSession = async (status: 'COMPLETED' | 'CANCELLED') => {
    if (!startTime) return;
    
    // Calculate elapsed time in minutes
    const elapsedSeconds = DEFAULT_TIME - timeLeft;
    const durationMinutes = Math.floor(elapsedSeconds / 60);

    // If cancelled too soon (< 1 minute), don't save
    if (durationMinutes < 1 && status === 'CANCELLED') {
      toast('Chưa đủ 1 phút, phiên không được lưu.', { icon: 'ℹ️' });
      return;
    }

    try {
      await pomodoroService.create({ 
        duration_minutes: durationMinutes,
        task_id: task?.id,
        subject_id: task?.subject_id || undefined,
        status: status,
        start_time: startTime.toISOString()
      });
      if (status === 'CANCELLED') {
        toast.success(`Đã lưu phiên kết thúc sớm (${durationMinutes} phút)`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu phiên Pomodoro');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const handleStop = () => {
    if ((isRunning || (timeLeft < DEFAULT_TIME && timeLeft > 0)) && !hasSavedRef.current) {
      hasSavedRef.current = true;
      saveSession('CANCELLED');
    }
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIME);
    setStartTime(null);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIME);
    setStartTime(null);
    hasSavedRef.current = false;
  };

  const handleMarkTaskCompleted = async () => {
    if (!task) return;
    try {
      await taskService.patch(task.id, { status: 'COMPLETED' });
      toast.success('Đã đánh dấu hoàn thành công việc!');
      setTask({ ...task, status: 'COMPLETED' } as Task);
    } catch (e) {
      toast.error('Có lỗi xảy ra khi cập nhật task');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-xl mx-auto p-6 mt-10">
      
      <div className="mb-6 flex justify-between items-center">
        <Link to="/tasks" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
          <ArrowLeft size={20} /> Quay lại
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-10 text-center relative overflow-hidden">
        
        {/* Decorative background circle */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-colors duration-1000 ${isRunning ? 'bg-red-500' : 'bg-gray-300'}`}></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pomodoro</h1>
          
          {loadingTask ? (
            <div className="h-6 flex items-center justify-center mt-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : task ? (
            <div className="mt-4 mb-6 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full border border-indigo-100">
              <span className="text-sm font-medium">Đang tập trung cho:</span>
              <span className="font-bold max-w-[200px] truncate">{task.title}</span>
            </div>
          ) : (
            <p className="text-gray-500 mt-2 mb-6">Tập trung cao độ - Nâng cao hiệu suất</p>
          )}

          <div className="text-8xl font-black text-red-500 mb-12 tabular-nums tracking-tight">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={handleStop}
              title="Dừng và lưu số phút đã học"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            >
              <Square size={20} className="fill-current" />
            </button>

            <button 
              onClick={toggleTimer}
              className={`text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${isRunning ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'}`}
            >
              {isRunning ? <Pause size={36} className="fill-current" /> : <Play size={36} className="ml-2 fill-current" />}
            </button>
            
            <button 
              onClick={resetTimer}
              title="Làm mới (Bỏ qua)"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105"
            >
              <RefreshCcw size={24} />
            </button>
          </div>

          {task && task.status !== 'COMPLETED' && (
            <div className="pt-6 border-t border-gray-100">
              <button 
                onClick={handleMarkTaskCompleted}
                className="inline-flex items-center gap-2 text-green-600 bg-green-50 hover:bg-green-100 px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <CheckCircle size={20} />
                Đánh dấu Task đã hoàn thành
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
