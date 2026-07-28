import type { Task, Subject } from '../types';
import { CheckCircle, Trash2, Wand2, Edit, CheckSquare, Square, Loader2, Clock, Calendar, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isPast, differenceInHours, differenceInDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  subject?: Subject;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onStart?: () => void;
  onAIBreakdown: () => void;
  isLoadingAI: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function TaskCard({
  task,
  subject,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggle,
  onStart,
  onAIBreakdown,
  isLoadingAI,
  isExpanded,
  onToggleExpand
}: TaskCardProps) {
  const isCompleted = task.status === 'COMPLETED';
  
  let deadlineColor = 'text-gray-500 bg-gray-100 border-gray-200';
  let deadlineText = 'Không có hạn';
  
  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    const now = new Date();
    
    deadlineText = format(deadlineDate, 'dd/MM/yyyy HH:mm', { locale: vi });
    
    if (isCompleted) {
      deadlineColor = 'text-gray-400 bg-gray-50 border-gray-100';
    } else if (isPast(deadlineDate)) {
      deadlineColor = 'text-red-700 bg-red-100 border-red-200 font-bold';
      deadlineText = `Quá hạn (${deadlineText})`;
    } else {
      const hoursLeft = differenceInHours(deadlineDate, now);
      const daysLeft = differenceInDays(deadlineDate, now);
      
      if (hoursLeft < 24) {
        deadlineColor = 'text-orange-700 bg-orange-100 border-orange-200 font-bold';
        deadlineText = `Còn < 24h (${deadlineText})`;
      } else if (daysLeft < 3) {
        deadlineColor = 'text-yellow-700 bg-yellow-100 border-yellow-200';
        deadlineText = `Còn < 3 ngày (${deadlineText})`;
      } else {
        deadlineColor = 'text-blue-700 bg-blue-50 border-blue-100';
      }
    }
  }

  const isSubtask = !!task.parent_task_id;

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${isCompleted ? 'opacity-70 bg-gray-50' : 'bg-white hover:shadow-md'} ${isSubtask ? 'ml-8 border-l-4 border-l-indigo-300' : 'border-gray-200'}`}>
      
      <div className="flex items-start gap-3">
        <button onClick={onSelect} className="mt-1 text-gray-400 hover:text-indigo-500 transition-colors">
          {isSelected ? <CheckSquare size={22} className="text-indigo-600" /> : <Square size={22} />}
        </button>
        
        <button 
          onClick={onToggle}
          className={`mt-1 flex-shrink-0 transition-colors ${isCompleted ? 'text-green-500 hover:text-green-600' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <CheckCircle size={24} />
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold truncate ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3 items-center">
            {!isSubtask && task.subtasks && task.subtasks.length > 0 && (
              <button 
                onClick={onToggleExpand}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Tiến độ: {task.subtasks.filter(s => s.status === 'COMPLETED').length}/{task.subtasks.length}
              </button>
            )}
            
            {(task.completed_pomodoros || 0) > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 font-medium flex items-center gap-1 border border-red-100">
                <Play size={10} />
                {task.completed_pomodoros} phiên ({task.focused_minutes}p)
              </span>
            )}

            {subject && (
              <span 
                className="text-xs px-2 py-1 rounded border text-white font-medium"
                style={{ backgroundColor: subject.color_code || '#6366f1', borderColor: 'transparent' }}
              >
                {subject.name}
              </span>
            )}
            
            <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${deadlineColor}`}>
              <Calendar size={12} />
              {deadlineText}
            </span>

            {task.priority === 'URGENT' && <span className="text-xs px-2 py-1 bg-red-600 text-white rounded font-bold">Khẩn cấp</span>}
            {task.priority === 'HIGH' && <span className="text-xs px-2 py-1 bg-orange-500 text-white rounded font-semibold">Cao</span>}
            
            {task.estimated_minutes > 0 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1 border">
                <Clock size={12} />
                {task.estimated_minutes}p
              </span>
            )}
            
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded border">
              {task.task_type}
            </span>
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 flex-shrink-0">
          {!isCompleted && (
            <>
              {task.status === 'PENDING' && (
                <button 
                  onClick={onStart}
                  className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Bắt đầu làm (In Progress)"
                >
                  <Play size={18} />
                </button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <Link 
                  to={`/pomodoro?taskId=${task.id}`}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Mở Pomodoro"
                >
                  <Clock size={18} />
                </Link>
              )}
            </>
          )}

          {!isSubtask && !isCompleted && (
            <button 
              onClick={onAIBreakdown} 
              disabled={isLoadingAI}
              className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              title="Dùng AI chia nhỏ công việc"
            >
              {isLoadingAI ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            </button>
          )}
          
          <button 
            onClick={onEdit}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sửa công việc"
          >
            <Edit size={18} />
          </button>
          
          <button 
            onClick={onDelete} 
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa công việc"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
