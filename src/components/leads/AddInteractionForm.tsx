'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addInteraction } from '@/app/actions/leads';
import { toast } from 'sonner';

export function AddInteractionForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('call');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    try {
      await addInteraction(leadId, type, content);
      toast.success('Interaction added successfully');
      setContent('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add interaction');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-border">
      <h3 className="text-sm font-semibold mb-3">Record Interaction</h3>
      <div className="flex gap-3 mb-3">
        <select 
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none text-sm transition-all"
        >
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
          <option value="note">Note</option>
        </select>
        <input 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Details..."
          className="flex-1 px-3 py-2 bg-muted rounded-lg border-transparent focus:border-blue-600 focus:bg-background outline-none text-sm transition-all"
        />
        <button 
          type="submit" 
          disabled={loading || !content.trim()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}
