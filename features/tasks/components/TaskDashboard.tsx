import React, { useState, useEffect } from 'react';
import { User, Notification } from '../../../types';
import { api } from '../../../supabaseAPI';
import { Task } from '../../../api/tasks';
import { SubScreenHeader, EmptyState } from '../../orders/shared';
import { useNavigate } from 'react-router-dom';
import { triggerRemoteNotification } from '../../../notificationUtils';

interface TaskDashboardProps {
  currentUser: User;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'MY_TASKS' | 'ASSIGNED_BY_ME'>('MY_TASKS');

  useEffect(() => {
    fetchTasks();
  }, [currentUser, filter]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let data;
      if (filter === 'MY_TASKS') {
        data = await api.tasks.getUserTasks(currentUser.id);
      } else {
        data = await api.tasks.getAssignedByMeTasks(currentUser.id);
      }
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // I need to add getAssignedByMeTasks to the API logic.
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-600 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleStatusChange = async (taskId: string, currentStatus: string, taskTitle: string, creatorId: string) => {
    const isMarkingComplete = currentStatus !== 'COMPLETED';
    
    if (isMarkingComplete) {
      const confirm = window.confirm(`Mark task "${taskTitle}" as completed?`);
      if (!confirm) return;
    }

    const nextStatus = isMarkingComplete ? 'COMPLETED' : 'PENDING';
    
    try {
      await api.tasks.updateTaskStatus(taskId, nextStatus);
      
      // Notify creator if marking as complete
      if (isMarkingComplete && creatorId !== currentUser.id) {
        triggerRemoteNotification({
          userIds: [creatorId],
          title: 'Task Completed ✅',
          body: `${currentUser.name} completed the task: ${taskTitle}`,
          data: { taskId }
        });
      }
      
      fetchTasks();
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.tasks.deleteTask(taskId);
      fetchTasks();
    } catch (e) {
      console.error(e);
      alert("Failed to delete task");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0f2f5]">
      {/* Header */}
      <SubScreenHeader 
        title="My Tasks"
        subtitle={filter === 'MY_TASKS' ? "Tasks assigned to me" : "Tasks I've assigned to others"}
        onBack={() => navigate('/dashboard')}
      />

      {/* Filter Tabs - Moved below header */}
      <div className="bg-white border-b border-gray-100 px-5 pb-4 flex justify-start">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-fit">
          <button 
            onClick={() => setFilter('MY_TASKS')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${filter === 'MY_TASKS' ? 'bg-white shadow-sm text-[#008069]' : 'text-gray-500'}`}
          >
            MY TASKS
          </button>
          <button 
            onClick={() => setFilter('ASSIGNED_BY_ME')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${filter === 'ASSIGNED_BY_ME' ? 'bg-white shadow-sm text-[#008069]' : 'text-gray-500'}`}
          >
            ASSIGNED BY ME
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008069] mb-4"></div>
            <p className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">Syncing Tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState 
            icon="✅" 
            title="All caught up!" 
            subtitle={filter === 'MY_TASKS' ? "No active tasks found in your list." : "You haven't assigned any tasks yet."} 
          />
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all">
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => handleStatusChange(task.id, task.status, task.title, task.created_by)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                    task.status === 'COMPLETED' ? 'bg-[#008069] border-[#008069]' : 'border-gray-200'
                  }`}
                >
                  {task.status === 'COMPLETED' && <span className="text-white text-xs">✓</span>}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-[15px] font-bold text-gray-900 truncate ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-[13px] text-gray-500 line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ml-2 ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        👤 {filter === 'MY_TASKS' ? `From: ${task.creator?.name || 'Admin'}` : `To: ${task.assignee?.name || 'User'}`}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[#008069]">
                        💬 Group: {task.channel?.name || 'Unknown'}
                      </span>
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500 font-bold' : ''}`}>
                          📅 Due: {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {task.created_by === currentUser.id && (
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-400 hover:text-red-600 font-bold p-1 transition-colors"
                          title="Delete Task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
