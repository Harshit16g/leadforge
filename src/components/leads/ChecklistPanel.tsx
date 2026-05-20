'use client'

import { useState, useEffect } from 'react';
import { CheckCircle2, Plus, Loader2, ShieldAlert } from 'lucide-react';
import { addTask, toggleTask } from '@/app/actions/leads';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function ChecklistPanel({ leadId, initialTasks }: { leadId: string, initialTasks: any[] }) {
  const { role } = useAuth();
  const isManager = role === 'manager';
  const [tasks, setTasks] = useState(initialTasks);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  async function handleToggle(task: any) {
    setLoadingId(task.id);
    try {
      await toggleTask(leadId, task.id, task.status);
      
      // Update local state for immediate feedback
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
      toast.success(`Task status updated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      await addTask(leadId, newTitle);
      
      // Add locally too
      const mockId = Math.random().toString();
      setTasks(prev => [...prev, { id: mockId, title: newTitle, status: 'pending' }]);
      
      setNewTitle('');
      setShowAddForm(false);
      toast.success('Task added successfully');
    } catch (err: any) {
      toast.error('Failed to add task');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[150px]">
      <div className="px-4 py-3 bg-muted/40 border-b border-border/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-sm text-foreground">Checklist</h3>
        </div>
        {isManager && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-blue-500 hover:bg-blue-500/10 p-1 rounded transition-colors"
          >
            <Plus className="size-4"/>
          </button>
        )}
      </div>
      
      <div className="p-2 space-y-1 overflow-y-auto flex-1 scrollbar-thin">
        {showAddForm && (
          <form onSubmit={handleAddTask} className="p-2 flex gap-2 border-b border-border mb-2 flex-shrink-0">
            <input 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Add new item..."
              required
              className="flex-1 px-2.5 py-1.5 bg-muted/50 border border-border rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-card transition-all text-foreground"
            />
            <button 
              type="submit" 
              disabled={isAdding}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              {isAdding ? <Loader2 className="size-3 animate-spin" /> : 'Add'}
            </button>
          </form>
        )}

        {tasks.map((task) => {
          const isDone = task.status === 'completed';
          const isLoading = loadingId === task.id;
          return (
            <div 
              key={task.id} 
              onClick={() => !isLoading && handleToggle(task)}
              className="flex items-start gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors group select-none"
            >
              <div className="mt-0.5 shrink-0">
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-blue-500" />
                ) : isDone ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <div className="size-4 rounded-full border-2 border-muted-foreground/40 group-hover:border-blue-500 transition-colors" />
                )}
              </div>
              <span className={cn("text-xs font-medium leading-tight", isDone ? "text-muted-foreground/60 line-through" : "text-foreground/90")}>
                {task.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
