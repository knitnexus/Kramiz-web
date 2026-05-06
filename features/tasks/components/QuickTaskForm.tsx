import React, { useState } from 'react';
import { User, Channel } from '../../../types';
import { api } from '../../../supabaseAPI';

interface QuickTaskFormProps {
  currentUser: User;
  channel: Channel;
  members: User[];
  onCreated: (taskId: string, title: string) => void;
  onClose: () => void;
}

export const QuickTaskForm: React.FC<QuickTaskFormProps> = ({ currentUser, channel, members, onCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ROLE_RANK: Record<string, number> = {
    'ADMIN': 5,
    'MERCHANDISER': 4,
    'MANAGER': 3,
    'SENIOR_STAFF': 2,
    'JUNIOR_STAFF': 1
  };

  const filteredMembers = members.filter(member => {
    if (currentUser.role === 'ADMIN') return true;
    const currentRank = ROLE_RANK[currentUser.role] || 0;
    const memberRank = ROLE_RANK[member.role] || 0;
    return currentRank >= memberRank;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assigneeId) return;

    setIsSubmitting(true);
    try {
      const task = await api.tasks.createTask({
        company_id: currentUser.company_id!,
        channel_id: channel.id,
        order_id: channel.order_id, // In this project, channel.order_id is used for order association
        assignee_id: assigneeId,
        created_by: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || undefined,
        priority: 'NORMAL'
      });

      // Add to specs as requested
      await api.addSpecToChannel(currentUser, channel.id, `TASK: ${title.trim()} (Assigned to: ${members.find(m => m.id === assigneeId)?.name || 'User'})`);

      onCreated(task.id, task.title);
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#008069] transition-all text-[15px] font-bold text-gray-900 placeholder:text-gray-300"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#008069] transition-all text-[14px] text-gray-600 placeholder:text-gray-300 min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full appearance-none border-2 border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#008069] transition-all text-[13px] font-bold text-gray-700 bg-white"
                required
              >
                <option value="">Assign to...</option>
                {filteredMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.id === currentUser.id ? 'Me' : member.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#008069] transition-all text-[13px] font-bold text-gray-700"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !assigneeId}
              className="flex-1 bg-[#008069] text-white py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-lg shadow-green-900/10 hover:bg-[#006a57] disabled:bg-gray-200 disabled:shadow-none transition-all active:scale-95"
            >
              {isSubmitting ? 'Saving...' : 'SAVE TASK'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 text-gray-400 hover:text-gray-600 font-bold text-[13px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
