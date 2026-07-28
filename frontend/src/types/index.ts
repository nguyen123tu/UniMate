export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'ASSIGNMENT' | 'EXAM' | 'PROJECT' | 'REVIEW' | 'READING' | 'OTHER';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  credits: number;
  color_code: string;
}

export interface SubjectCreate {
  name: string;
  credits: number;
  color_code: string;
}

export interface SubjectUpdate {
  name?: string;
  credits?: number;
  color_code?: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  estimated_minutes: number;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  subtasks?: Task[];
  focused_minutes?: number;
  completed_pomodoros?: number;
}

export interface SubTaskBreakdown {
  title: string;
  description: string;
  estimated_minutes: number;
  order: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface SubjectStats {
  id: string;
  name: string;
  color: string;
  total_tasks: number;
  completed_tasks: number;
  pomodoro_minutes: number;
  completion_rate: number;
}

export interface Notification {
  id: string;
  task_id: string;
  type: 'OVERDUE' | 'DUE_TODAY' | 'HIGH_PRIORITY';
  message: string;
  created_at: string;
}

export interface DashboardStats {
  status: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
  };
  deadlines: {
    overdue: number;
    due_today: number;
    due_in_7_days: number;
    no_deadline: number;
  };
  subjects: SubjectStats[];
  demanding_subject: SubjectStats | null;
  priority_lists: {
    overdue: Task[];
    today: Task[];
    upcoming: Task[];
  };
}

export interface TaskCreate {
  title: string;
  description?: string;
  deadline?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  task_type?: TaskType;
  estimated_minutes?: number;
  position?: number;
  subject_id?: string | null;
  parent_task_id?: string | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  deadline?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  task_type?: TaskType;
  estimated_minutes?: number;
  position?: number;
  subject_id?: string | null;
  parent_task_id?: string | null;
}

export interface ApiErrorResponse {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

export interface TaskQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  subject_id?: string;
  priority?: string;
  status?: string;
  overdue?: boolean;
  deadline_from?: string;
  deadline_to?: string;
}

export interface AiBreakdownResponse {
  subtasks: SubTaskBreakdown[];
}

