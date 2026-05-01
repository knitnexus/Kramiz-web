import { supabase } from '../supabaseClient';
import { User, UserRole } from '../types';

export interface Task {
  id: string;
  company_id: string;
  channel_id: string;
  order_id: string;
  assignee_id: string;
  created_by: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  created_at: string;
  updated_at: string;
  assignee?: { name: string };
  creator?: { name: string };
  channel?: { name: string };
}

/** 
 * Hierarchy Check for Task Assignment 
 * ADMIN > MERCHANDISER > MANAGER > SENIOR_STAFF > JUNIOR_STAFF
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  ADMIN: 5,
  MERCHANDISER: 4,
  MANAGER: 3,
  SENIOR_STAFF: 2,
  JUNIOR_STAFF: 1
};

export const canAssignTo = (assignerRole: UserRole, targetRole: UserRole): boolean => {
  if (assignerRole === 'ADMIN') return true;
  return ROLE_LEVELS[assignerRole] > ROLE_LEVELS[targetRole];
};

export const tasksApi = {
  getChannelTasks: async (channelId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!assignee_id(name),
        creator:users!created_by(name),
        channel:channels(name)
      `)
      .eq('channel_id', channelId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as Task[];
  },

  getUserTasks: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!assignee_id(name),
        creator:users!created_by(name),
        channel:channels(name)
      `)
      .eq('assignee_id', userId)
      .neq('status', 'COMPLETED')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data as Task[];
  },

  getAssignedByMeTasks: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!assignee_id(name),
        creator:users!created_by(name),
        channel:channels(name)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Task[];
  },

  createTask: async (params: {
    company_id: string;
    channel_id: string;
    order_id: string;
    assignee_id: string;
    created_by: string;
    title: string;
    description?: string;
    due_date?: string;
    priority?: string;
  }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...params,
        status: 'PENDING',
        priority: params.priority || 'NORMAL'
      })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  deleteTask: async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
  }
};
