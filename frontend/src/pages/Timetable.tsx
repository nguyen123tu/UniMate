import { useState, useEffect } from 'react';
import { timetableService } from '../services/timetable';
import { subjectService } from '../services/subject';
import { Plus, Trash2, Clock, MapPin } from 'lucide-react';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function Timetable() {
  const [events, setEvents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [subjectId, setSubjectId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, subjectsData] = await Promise.all([
        timetableService.getAll(),
        subjectService.getAll()
      ]);
      setEvents(eventsData);
      setSubjects(subjectsData);
      if (subjectsData.length > 0) setSubjectId(subjectsData[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return alert('Vui lòng chọn môn học');
    if (startTime >= endTime) return alert('Giờ kết thúc phải lớn hơn giờ bắt đầu');

    try {
      await timetableService.create({
        subject_id: subjectId,
        day_of_week: dayOfWeek,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        room: room || null
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa lịch học này?')) return;
    try {
      await timetableService.delete(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Thời Khóa Biểu</h1>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow mb-8 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
          <select 
            value={subjectId} 
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="" disabled>-- Chọn môn học --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thứ</label>
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md">
            {DAYS.map((day, idx) => <option key={idx} value={idx + 1}>{day}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phòng (Tùy chọn)</label>
          <input type="text" value={room} onChange={e => setRoom(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="VD: D9-401" />
        </div>
        <div className="md:col-span-6 flex justify-end">
          <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-md flex items-center gap-2">
            <Plus size={18} /> Thêm lịch học
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {DAYS.map((dayName, idx) => {
          const dayNumber = idx + 1;
          const dayEvents = events.filter(e => e.day_of_week === dayNumber).sort((a, b) => a.start_time.localeCompare(b.start_time));
          
          return (
            <div key={dayNumber} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
              <div className="bg-gray-200 text-center py-2 font-semibold text-gray-700 border-b border-gray-300">
                {dayName}
              </div>
              <div className="p-2 space-y-2 min-h-[150px]">
                {dayEvents.map(evt => {
                  const subject = subjects.find(s => s.id === evt.subject_id);
                  return (
                    <div key={evt.id} className="p-3 rounded shadow-sm border-l-4 bg-white relative group" style={{ borderColor: subject?.color_code || '#4f46e5' }}>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">{subject?.name || 'Đã xóa'}</h4>
                      <div className="flex items-center text-xs text-gray-500 gap-1 mb-1">
                        <Clock size={12} /> {evt.start_time.substring(0,5)} - {evt.end_time.substring(0,5)}
                      </div>
                      {evt.room && (
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                          <MapPin size={12} /> {evt.room}
                        </div>
                      )}
                      <button onClick={() => handleDelete(evt.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 hidden group-hover:block">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
