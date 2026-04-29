import React, { useState, useEffect } from 'react';
import { User, Channel, UserRole } from '../../../types';
import { api } from '../../../supabaseAPI';
import { Task, canAssignTo } from '../../../api/tasks';
import { triggerRemoteNotification } from '../../../notificationUtils';

interface TaskListProps {
  channel: Channel;
  currentUser: User;
  onAddTaskClick?: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ channel, currentUser, onAddTaskClick }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canCreateTask = ['ADMIN', 'MERCHANDISER', 'MANAGER', 'SENIOR_STAFF'].includes(currentUser.role);

  useEffect(() => {
    fetchTasks();
  }, [channel.id]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await api.tasks.getChannelTasks(channel.id);
      setTasks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const isMarkingComplete = task.status !== 'COMPLETED';
    
    if (isMarkingComplete) {
      if (!window.confirm(`Mark "${task.title}" as completed?`)) return;
    }

    const nextStatus = isMarkingComplete ? 'COMPLETED' : 'PENDING';
    
    try {
      await api.tasks.updateTaskStatus(task.id, nextStatus);
      
      if (isMarkingComplete && task.created_by !== currentUser.id) {
        triggerRemoteNotification({
          userIds: [task.created_by],
          title: 'Task Completed ✅',
          body: `${currentUser.name} completed the task in ${channel.name}: ${task.title}`,
          data: { taskId: task.id, channelId: channel.id }
        });
      }
      
      fetchTasks();
    } catch (e) {
      console.error(e);
      alert("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.tasks.deleteTask(taskId);
      fetchTasks();
    } catch (e) {
      console.error(e);
      alert("Failed to delete task");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Task Button */}
      {canCreateTask && (
        <button 
          onClick={onAddTaskClick}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-[13px] font-bold text-gray-500 hover:border-[#008069] hover:text-[#008069] transition-all flex items-center justify-center gap-2"
        >
          <span>+ Add New Task</span>
        </button>
      )}

      {/* Task Items */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-8 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Syncing Tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-bold text-gray-400">No tasks assigned to this group yet.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
              <button 
                onClick={() => toggleTask(task)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  task.status === 'COMPLETED' ? 'bg-[#008069] border-[#008069]' : 'border-gray-200'
                }`}
              >
                {task.status === 'COMPLETED' && <span className="text-white text-[10px]">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-bold text-gray-800 truncate ${task.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
                  {task.title}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">👤 {task.assignee?.name}</span>
                    {task.due_date && (
                      <span className={`text-[10px] font-bold ${new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500' : 'text-gray-400'}`}>
                        📅 {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  {task.created_by === currentUser.id && (
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
