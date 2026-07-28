import { useState, useEffect } from 'react';
import type { Task, SubTaskBreakdown, Subject, TaskStatus } from '../types';
import { aiService } from '../services/ai';
import { taskService } from '../services/task';
import { X, Save, Loader2, Sparkles, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  subject?: Subject;
  onSuccess: () => void;
}

export default function AIBreakdownModal({ isOpen, onClose, task, subject, onSuccess }: Props) {
  const [subtasks, setSubtasks] = useState<SubTaskBreakdown[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'append' | 'replace'>('append');

  const hasExisting = task && task.subtasks && task.subtasks.length > 0;

  useEffect(() => {
    if (isOpen && task) {
      setSubtasks([]);
      fetchAI();
    }
  }, [isOpen, task]);

  const fetchAI = async () => {
    if (!task) return;
    setIsFetching(true);
    try {
      const res = await aiService.breakdownTask({
        task_title: task.title,
        task_description: task.description || undefined,
        subject_name: subject?.name,
        deadline: task.deadline || undefined,
        estimated_minutes: task.estimated_minutes || undefined
      });
      if (res && res.subtasks) {
        setSubtasks(res.subtasks);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi khi phân tích AI');
      onClose();
    } finally {
      setIsFetching(false);
    }
  };

  const handleAdd = () => {
    setSubtasks([...subtasks, { title: '', description: '', estimated_minutes: 15, order: subtasks.length + 1 }]);
  };

  const handleRemove = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof SubTaskBreakdown, value: any) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    setSubtasks(updated);
  };

  const handleSave = async () => {
    if (!task) return;
    // Validate
    if (subtasks.length === 0) {
      toast.error('Cần ít nhất 1 subtask');
      return;
    }
    if (subtasks.some(s => !s.title.trim())) {
      toast.error('Tên subtask không được để trống');
      return;
    }

    setIsSaving(true);
    try {
      if (saveMode === 'replace' && hasExisting) {
        await taskService.bulkDelete(task.subtasks!.map(s => s.id));
      }
      const payload = subtasks.map(s => ({
        title: s.title,
        description: s.description,
        estimated_minutes: s.estimated_minutes,
        status: 'PENDING' as TaskStatus
      }));
      await taskService.bulkCreateSubtasks(task.id, payload);
      toast.success('Đã lưu các subtasks thành công!');
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-full">
        
        <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-50">
          <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Sparkles className="text-indigo-600" />
            AI Breakdown: {task.title}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {isFetching ? (
            <div className="py-20 flex flex-col items-center justify-center text-indigo-500">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="font-medium text-lg">AI đang phân tích và chia nhỏ công việc...</p>
              <p className="text-gray-500 text-sm mt-2 text-center max-w-sm">Quá trình này có thể mất vài giây. Groq Llama 3.1 đang tối ưu hóa thời gian cho bạn.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-600">Bạn có thể tùy chỉnh danh sách đề xuất bên dưới trước khi lưu:</p>
                <button onClick={handleAdd} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                  <Plus size={16} /> Thêm thủ công
                </button>
              </div>

              {subtasks.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  AI không trả về kết quả nào. Hãy thử thêm thủ công.
                </div>
              ) : (
                subtasks.map((st, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start group">
                    <div className="bg-indigo-100 text-indigo-700 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => handleChange(idx, 'title', e.target.value)}
                          placeholder="Tên subtask..."
                          className="flex-1 border-b border-gray-300 focus:border-indigo-500 px-1 py-1 bg-transparent focus:outline-none font-medium text-gray-800"
                        />
                        <div className="flex items-center gap-1 w-24 border-b border-gray-300 focus-within:border-indigo-500">
                          <input
                            type="number"
                            min="0"
                            value={st.estimated_minutes}
                            onChange={(e) => handleChange(idx, 'estimated_minutes', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent focus:outline-none text-right"
                          />
                          <span className="text-gray-500 text-sm">phút</span>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={st.description}
                        onChange={(e) => handleChange(idx, 'description', e.target.value)}
                        placeholder="Mô tả chi tiết (không bắt buộc)..."
                        className="w-full border-b border-gray-200 focus:border-indigo-500 px-1 py-1 bg-transparent focus:outline-none text-sm text-gray-600"
                      />
                    </div>
                    <button onClick={() => handleRemove(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {hasExisting && subtasks.length > 0 && !isFetching && (
          <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Công việc này đang có {task.subtasks!.length} subtasks:</span>
            <div className="flex items-center gap-4 text-sm bg-white p-1 rounded-lg border shadow-sm">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md hover:bg-gray-50">
                <input type="radio" checked={saveMode === 'append'} onChange={() => setSaveMode('append')} className="text-indigo-600 focus:ring-indigo-500" />
                <span>Thêm vào</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md hover:bg-gray-50">
                <input type="radio" checked={saveMode === 'replace'} onChange={() => setSaveMode('replace')} className="text-red-600 focus:ring-red-500" />
                <span className="text-red-600">Ghi đè</span>
              </label>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t bg-white flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isSaving || isFetching}
            className="px-5 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isFetching || subtasks.length === 0}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Lưu {subtasks.length} subtasks
          </button>
        </div>

      </div>
    </div>
  );
}
