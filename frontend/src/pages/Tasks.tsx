import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { taskService } from '../services/task';
import { subjectService } from '../services/subject';
import { Plus, CheckSquare, Square, Search, Loader2, ListTodo, CalendarX2, SearchX, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Task, Subject, TaskCreate, TaskUpdate } from '../types';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import AIBreakdownModal from '../components/AIBreakdownModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDebounce } from '../hooks/useDebounce';
import { startOfDay, endOfDay, addDays, startOfTomorrow } from 'date-fns';

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTask, setAiTask] = useState<Task | null>(null);

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Bulk State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  
  // Loading States
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [errorFetching, setErrorFetching] = useState(false);

  // Read URL Params
  const view = searchParams.get('view') || 'all'; // all, today, upcoming, overdue, completed
  const search = searchParams.get('search') || '';
  const filterSubject = searchParams.get('subject') || '';
  const filterPriority = searchParams.get('priority') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const isLoadMoreRef = React.useRef(false);
  
  // Local Search & Debounce
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 400);

  // Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    checkboxLabel?: string;
    onConfirm: (checked?: boolean) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: true,
    onConfirm: () => {}
  });

  // Helpers to Update URL Params
  const updateParams = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === '') params.delete(k);
      else params.set(k, v);
    });
    setSearchParams(params);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateParams({ search: debouncedSearch, page: '1' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    loadTasks(isLoadMoreRef.current);
    isLoadMoreRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Reload when URL changes

  const loadTasks = async (isLoadMore = false) => {
    if (!isLoadMore) setIsLoadingList(true);
    setErrorFetching(false);
    
    try {
      const apiParams: Record<string, any> = {
        page,
        page_size: pageSize,
      };
      
      if (search) apiParams.search = search;
      if (filterSubject) apiParams.subject_id = filterSubject;
      if (filterPriority) apiParams.priority = filterPriority;

      // Handle View modes
      if (view === 'completed') {
        apiParams.status = 'COMPLETED';
      } else if (view === 'overdue') {
        apiParams.overdue = true;
      } else if (view === 'today') {
        apiParams.deadline_from = startOfDay(new Date()).toISOString();
        apiParams.deadline_to = endOfDay(new Date()).toISOString();
        apiParams.status = 'PENDING,IN_PROGRESS';
      } else if (view === 'upcoming') {
        apiParams.deadline_from = startOfTomorrow().toISOString();
        apiParams.deadline_to = addDays(new Date(), 7).toISOString();
        apiParams.status = 'PENDING,IN_PROGRESS';
      }

      const data = await taskService.getAll(apiParams);

      if (isLoadMore) setTasks(prev => [...prev, ...data.items]);
      else setTasks(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (e: any) {
      toast.error('Lỗi khi tải danh sách công việc');
      setErrorFetching(true);
    } finally {
      if (!isLoadMore) setIsLoadingList(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (e) { }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleCreateOrUpdate = async (payload: TaskCreate | TaskUpdate, isEdit: boolean) => {
    if (isEdit && editingTask) {
      await taskService.update(editingTask.id, payload as TaskUpdate);
      toast.success('Cập nhật công việc thành công');
    } else {
      await taskService.create(payload as TaskCreate);
      toast.success('Đã thêm công việc mới');
    }
    loadTasks();
  };

  const handleDelete = (task: Task) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa công việc',
      message: 'Bạn có chắc chắn muốn xóa công việc này không?',
      checkboxLabel: hasSubtasks ? 'Xóa toàn bộ subtask bên trong (bỏ chọn để giữ lại dưới dạng task độc lập)' : undefined,
      isDestructive: true,
      onConfirm: async (deleteSubtasks?: boolean) => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        // Optimistic delete
        const oldTasks = [...tasks];
        setTasks(tasks.filter(t => t.id !== task.id));
        
        try {
          await taskService.delete(task.id, deleteSubtasks || false);
          toast.success('Đã xóa công việc');
        } catch (e) {
          toast.error('Xóa thất bại');
          setTasks(oldTasks); // revert
        }
      }
    });
  };

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    
    // Optimistic update
    const oldTasks = [...tasks];
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await taskService.patch(task.id, { status: newStatus });
      toast.success(newStatus === 'COMPLETED' ? 'Đã hoàn thành!' : 'Đã đánh dấu chưa xong');
    } catch (e) {
      toast.error('Lỗi cập nhật trạng thái');
      setTasks(oldTasks); // revert
    }
  };

  const handleStart = async (taskToStart: Task) => {
    const oldTasks = [...tasks];
    setTasks(prev => prev.map(t => {
      if (t.id === taskToStart.id) return { ...t, status: 'IN_PROGRESS' };
      if (t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === taskToStart.id ? { ...s, status: 'IN_PROGRESS' } : s)
        };
      }
      return t;
    }));
    
    try {
      await taskService.patch(taskToStart.id, { status: 'IN_PROGRESS' });
      toast.success('Đã bắt đầu công việc!');
    } catch (e) {
      toast.error('Lỗi cập nhật trạng thái');
      setTasks(oldTasks);
    }
  };

  const handleAIBreakdown = (task: Task) => {
    setAiTask(task);
    setIsAIModalOpen(true);
  };

  // Bulk
  const toggleSelectTask = (id: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTaskIds(newSet);
  };
  const selectAll = () => {
    if (selectedTaskIds.size === tasks.length && tasks.length > 0) setSelectedTaskIds(new Set());
    else setSelectedTaskIds(new Set(tasks.map(t => t.id)));
  };
  const handleBulkComplete = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      await taskService.bulkComplete(Array.from(selectedTaskIds));
      toast.success(`Đã hoàn thành ${selectedTaskIds.size} công việc`);
      setSelectedTaskIds(new Set());
      loadTasks();
    } catch (e) { toast.error('Lỗi thao tác hàng loạt'); }
    setIsBulkLoading(false);
  };
  const handleBulkDelete = () => {
    if (selectedTaskIds.size === 0) return;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa hàng loạt',
      message: `Bạn có chắc chắn muốn xóa ${selectedTaskIds.size} công việc đã chọn?`,
      checkboxLabel: 'Xóa cả subtask bên trong (nếu có)',
      isDestructive: true,
      onConfirm: async (checked?: boolean) => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setIsBulkLoading(true);
        
        // Optimistic
        const oldTasks = [...tasks];
        const oldSelected = new Set(selectedTaskIds);
        setTasks(tasks.filter(t => !selectedTaskIds.has(t.id)));
        setSelectedTaskIds(new Set());
        
        try {
          await taskService.bulkDelete(Array.from(oldSelected), checked || false);
          toast.success(`Đã xóa ${oldSelected.size} công việc`);
        } catch (e) { 
          toast.error('Lỗi thao tác hàng loạt');
          setTasks(oldTasks);
          setSelectedTaskIds(oldSelected);
        }
        setIsBulkLoading(false);
      }
    });
  };

  // Empty states UI
  const renderEmptyState = () => {
    if (errorFetching) return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <CalendarX2 size={48} className="text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Lỗi kết nối máy chủ</h3>
        <p>Không thể tải danh sách công việc lúc này. Vui lòng thử lại sau.</p>
        <button onClick={() => loadTasks()} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 font-medium">Thử lại</button>
      </div>
    );

    if (search) return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <SearchX size={48} className="text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy kết quả</h3>
        <p>Không có công việc nào khớp với "{search}".</p>
        <button onClick={() => updateParams({ search: '' })} className="mt-4 text-indigo-600 font-medium hover:underline">Xóa bộ lọc tìm kiếm</button>
      </div>
    );

    if (view === 'overdue') return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <CheckCircle size={48} className="text-green-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Tuyệt vời!</h3>
        <p>Bạn không có bất kỳ công việc nào quá hạn.</p>
      </div>
    );
    
    if (view === 'today') return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <Clock size={48} className="text-blue-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Trống lịch hôm nay</h3>
        <p>Bạn đã hoàn thành hết mục tiêu hoặc chưa lên lịch cho hôm nay.</p>
        <button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="mt-4 text-indigo-600 font-medium hover:underline">Thêm công việc cho hôm nay</button>
      </div>
    );

    return (
      <div className="flex flex-col items-center py-20 text-gray-500">
        <ListTodo size={48} className="text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Chưa có công việc nào</h3>
        <p>Hãy bắt đầu bằng cách thêm một công việc mới vào danh sách.</p>
        <button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
          Tạo công việc ngay
        </button>
      </div>
    );
  };

  const viewTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'today', label: 'Hôm nay' },
    { id: 'upcoming', label: 'Sắp tới' },
    { id: 'overdue', label: 'Quá hạn' },
    { id: 'completed', label: 'Đã xong' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-full min-h-[90vh]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Công việc của tôi</h1>
          <p className="text-gray-500 mt-1">Quản lý mục tiêu và theo dõi tiến độ dễ dàng</p>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          Tạo công việc
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          
          <div className="flex overflow-x-auto pb-2 lg:pb-0 hide-scrollbar gap-2">
            {viewTabs.map(t => (
              <button
                key={t.id}
                onClick={() => updateParams({ view: t.id, page: '1' })}
                className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors text-sm ${view === t.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                name="searchInput"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                type="text" 
                placeholder="Tìm kiếm công việc..." 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm"
              />
            </form>
            <div className="flex gap-2">
              <select 
                value={filterSubject} 
                onChange={(e) => updateParams({ subject: e.target.value, page: '1' })}
                className="flex-1 sm:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Tất cả môn học</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select 
                value={filterPriority} 
                onChange={(e) => updateParams({ priority: e.target.value, page: '1' })}
                className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Ưu tiên</option>
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedTaskIds.size > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
            <span className="text-sm font-semibold text-indigo-800">Đã chọn {selectedTaskIds.size} công việc</span>
            <div className="flex gap-2">
              <button onClick={handleBulkComplete} disabled={isBulkLoading} className="text-sm bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-gray-700 px-4 py-1.5 rounded-md transition-colors font-medium">Đánh dấu hoàn thành</button>
              <button onClick={handleBulkDelete} disabled={isBulkLoading} className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-4 py-1.5 rounded-md transition-colors font-medium">Xóa đã chọn</button>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1">
        {isLoadingList ? (
          <div className="py-20 flex justify-center items-center gap-3 text-indigo-500">
            <Loader2 size={32} className="animate-spin" />
            <span className="font-medium">Đang tải dữ liệu...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white border rounded-2xl shadow-sm h-full flex items-center justify-center min-h-[300px]">
            {renderEmptyState()}
          </div>
        ) : (
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            
            <div className="p-4 bg-gray-50 border-b flex items-center gap-4 sticky top-0 z-10">
              <button onClick={selectAll} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Chọn tất cả">
                {selectedTaskIds.size === tasks.length ? <CheckSquare size={22} className="text-indigo-600" /> : <Square size={22} />}
              </button>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Kết quả: {total} công việc
              </span>
            </div>
            
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              {tasks.map((task) => (
                <React.Fragment key={task.id}>
                  <TaskCard 
                    task={task}
                    subject={subjects.find(s => s.id === task.subject_id)}
                    isSelected={selectedTaskIds.has(task.id)}
                    onSelect={() => toggleSelectTask(task.id)}
                    onEdit={() => { setEditingTask(task); setIsFormOpen(true); }}
                    onDelete={() => handleDelete(task)}
                    onToggle={() => handleToggle(task)}
                    onStart={() => handleStart(task)}
                    onAIBreakdown={() => handleAIBreakdown(task)}
                    isLoadingAI={false}
                    isExpanded={expandedTasks.has(task.id)}
                    onToggleExpand={() => toggleExpand(task.id)}
                  />
                  {/* Nested Subtasks Render */}
                  {expandedTasks.has(task.id) && task.subtasks && task.subtasks.map(sub => (
                    <TaskCard 
                      key={sub.id}
                      task={sub}
                      subject={subjects.find(s => s.id === sub.subject_id)}
                      isSelected={selectedTaskIds.has(sub.id)}
                      onSelect={() => toggleSelectTask(sub.id)}
                      onEdit={() => { setEditingTask(sub); setIsFormOpen(true); }}
                      onDelete={() => handleDelete(sub)}
                      onToggle={() => handleToggle(sub)}
                      onStart={() => handleStart(sub)}
                      onAIBreakdown={() => handleAIBreakdown(sub)}
                      isLoadingAI={false}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Load More Button */}
            {page < totalPages && (
              <div className="p-4 border-t bg-gray-50 flex items-center justify-center mt-auto">
                <button 
                  onClick={() => {
                    isLoadMoreRef.current = true;
                    updateParams({ page: (page + 1).toString() });
                  }}
                  className="px-6 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm font-medium text-indigo-600 hover:bg-gray-50 hover:text-indigo-700 transition-colors"
                >
                  Tải thêm
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        taskToEdit={editingTask}
        subjects={subjects}
        onSubmit={handleCreateOrUpdate}
      />
      
      <AIBreakdownModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        task={aiTask}
        subject={subjects.find(s => s.id === aiTask?.subject_id)}
        onSuccess={loadTasks}
      />
      
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
