import React, { useState, useEffect } from 'react';
import { subjectService } from '../services/subject';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Subject } from '../types';

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState('');
  const [colorCode, setColorCode] = useState('#4f46e5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (e: any) {
      toast.error('Lỗi khi tải danh sách môn học');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên môn học');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await subjectService.create({ name, color_code: colorCode, credits: 0 });
      setName('');
      toast.success('Thêm môn học thành công!');
      loadSubjects();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Lỗi khi thêm môn học');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa môn học này? Các công việc thuộc môn học này sẽ không bị xóa mà chỉ bị gỡ khỏi môn.')) return;
    try {
      await subjectService.delete(id);
      toast.success('Xóa môn học thành công');
      loadSubjects();
    } catch (e: any) {
      toast.error('Lỗi khi xóa môn học');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý Môn Học</h1>
      
      <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-primary focus:border-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Nhập môn AI..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc</label>
          <input
            type="color"
            className="w-14 h-10 p-1 border rounded-md cursor-pointer"
            value={colorCode}
            onChange={(e) => setColorCode(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
          Thêm Mới
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <div key={sub.id} className="bg-white rounded-xl shadow p-6 border-t-4" style={{ borderColor: sub.color_code || '#4f46e5' }}>
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-gray-800">{sub.name}</h3>
              <button onClick={() => handleDelete(sub.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {subjects.length === 0 && <p className="text-gray-500 col-span-full text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">Chưa có môn học nào. Hãy thêm môn học đầu tiên nhé!</p>}
      </div>
    </div>
  );
}
