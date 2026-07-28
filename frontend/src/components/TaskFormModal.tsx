import React, { useState, useEffect } from 'react';
import type { Subject, Task, TaskCreate, TaskUpdate, TaskPriority, TaskType } from '../types';
import { X, Save, Loader2 } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  subjects: Subject[];
  onSubmit: (payload: TaskCreate | TaskUpdate, isEdit: boolean) => Promise<void>;
}

export default function TaskFormModal({ isOpen, onClose, taskToEdit, subjects, onSubmit }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [taskType, setTaskType] = useState<TaskType>('OTHER');
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [deadline, setDeadline] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setSubjectId(taskToEdit.subject_id || '');
        setPriority(taskToEdit.priority || 'MEDIUM');
        setTaskType(taskToEdit.task_type || 'OTHER');
        setEstimatedMinutes(taskToEdit.estimated_minutes || 0);
        
        if (taskToEdit.deadline) {
          // convert from ISO to datetime-local format (YYYY-MM-DDTHH:mm)
          const d = new Date(taskToEdit.deadline);
          // adjust for local timezone offset
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setDeadline(localISO);
        } else {
          setDeadline('');
        }
      } else {
        // Reset form for create
        setTitle('');
        setDescription('');
        setSubjectId('');
        setPriority('MEDIUM');
        setTaskType('OTHER');
        setEstimatedMinutes(0);
        setDeadline('');
      }
      setErrors({});
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Tên công việc không được để trống';
    if (estimatedMinutes < 0) newErrors.estimatedMinutes = 'Thời gian dự kiến phải >= 0';
    if (deadline) {
      const d = new Date(deadline);
      if (isNaN(d.getTime())) newErrors.deadline = 'Thời gian không hợp lệ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        subject_id: subjectId || null,
        priority,
        task_type: taskType,
        estimated_minutes: estimatedMinutes,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      };

      if (!taskToEdit) {
        payload.status = 'PENDING';
      }

      await onSubmit(payload, !!taskToEdit);
      onClose(); // only close if success
    } catch (err: any) {
      // If backend returns a standardized error format
      if (err.response?.data?.field) {
        setErrors({ [err.response.data.field]: err.response.data.message });
      } else {
        setErrors({ submit: err.response?.data?.message || 'Có lỗi xảy ra khi lưu công việc' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
        
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {taskToEdit ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {errors.submit && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {errors.submit}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên công việc <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100 focus:border-indigo-400'}`}
                placeholder="VD: Làm bài tập toán..."
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                placeholder="Ghi chú thêm về công việc này..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Môn học</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                >
                  <option value="">-- Tự do --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hạn nộp</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.deadline ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100 focus:border-indigo-400'}`}
                />
                {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                >
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Loại công việc</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                >
                  <option value="ASSIGNMENT">Bài tập</option>
                  <option value="EXAM">Thi cử</option>
                  <option value="PROJECT">Đồ án</option>
                  <option value="READING">Tài liệu</option>
                  <option value="REVIEW">Ôn tập</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Dự kiến (Phút)</label>
                <input
                  type="number"
                  min="0"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.estimatedMinutes ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100 focus:border-indigo-400'}`}
                />
                {errors.estimatedMinutes && <p className="text-red-500 text-xs mt-1">{errors.estimatedMinutes}</p>}
              </div>
            </div>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            form="task-form"
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {taskToEdit ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>

      </div>
    </div>
  );
}
