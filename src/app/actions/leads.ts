'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  
  const notesText = formData.get('notes') as string || '';
  const vehicle = formData.get('vehicle') as string || '';
  const budget = formData.get('budget') as string || '';
  const fuel = formData.get('fuel') as string || '';
  const financing = formData.get('financing') as string || '';
  const location = formData.get('location') as string || '';

  // Serialize interest fields as JSON in notes column to bypass DDL limits gracefully
  const serializedNotes = JSON.stringify({
    notes: notesText,
    vehicle,
    budget,
    fuel,
    financing,
    location
  });

  const leadData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    business_name: formData.get('business_name') || 'Individual Buyer',
    source: formData.get('source'),
    status: formData.get('status') || 'new',
    priority: formData.get('priority') || 'medium',
    health: formData.get('health') || 'warm',
    score: Number(formData.get('score')) || 50,
    notes: serializedNotes,
    assigned_to: formData.get('assigned_to') || null
  };

  const { error } = await supabase.from('leads').insert([leadData]);
  if (error) throw new Error(error.message);

  revalidatePath('/leads');
  revalidatePath('/dashboard');
}

export async function addInteraction(leadId: string, type: string, content: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('interactions').insert([{
    lead_id: leadId,
    type,
    content
  }]);

  if (error) throw new Error(error.message);

  // Auto-progress lead status to 'contacted' if it was new, and update last_interaction_at timestamp
  const { data: lead } = await supabase.from('leads').select('status').eq('id', leadId).single();
  const updateData: any = { last_interaction_at: new Date().toISOString() };
  if (lead && lead.status === 'new' && (type === 'call' || type === 'email' || type === 'meeting')) {
    updateData.status = 'contacted';
  }
  await supabase.from('leads').update(updateData).eq('id', leadId);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  revalidatePath('/dashboard');
}

export async function updateLead(leadId: string, data: any) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('leads').update(data).eq('id', leadId);
  
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  revalidatePath('/ledger');
  revalidatePath('/dashboard');
}

/**
 * Automatically executes CRM workflow automation rules:
 * A) Archived Completed leads after a 6-hour delay.
 * B) Archived Lost leads after a 6-hour delay.
 * C) Reverts unresponsive intermediate-stage leads back to 'new' if inactive for > 24 hours.
 */
export async function runLeadAutomationRules() {
  const supabase = await createClient();
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  // Fetch active leads that are either completed, lost, or in intermediate stages
  const { data: activeLeads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('archived', false);

  if (error || !activeLeads || activeLeads.length === 0) return;

  // Pre-load sales profiles for premium round-robin / senior routing
  const { data: reps } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'sales');
  const seniorRep = reps?.find(r => r.name.includes('Sarah') || r.name.includes('Jenkins')) || reps?.[0];

  for (const lead of activeLeads) {
    const latestTime = lead.last_interaction_at || lead.created_at;
    
    // Rule A: Completed leads archived after 6 hours
    if (lead.status === 'completed' && latestTime < sixHoursAgo) {
      await supabase.from('leads').update({
        archived: true,
        archived_at: now.toISOString(),
        archived_by: 'System Automation'
      }).eq('id', lead.id);

      await supabase.from('interactions').insert([{
        lead_id: lead.id,
        type: 'note',
        content: 'System Automation: Completed lead automatically archived to Ledger after 6-hour delay.'
      }]);
    }

    // Rule B: Lost leads archived after 6 hours
    else if (lead.status === 'lost' && latestTime < sixHoursAgo) {
      await supabase.from('leads').update({
        archived: true,
        archived_at: now.toISOString(),
        archived_by: 'System Automation'
      }).eq('id', lead.id);

      await supabase.from('interactions').insert([{
        lead_id: lead.id,
        type: 'note',
        content: 'System Automation: Lost lead automatically archived to Ledger after 6-hour delay.'
      }]);
    }

    // Rule C: Unresponsive leads revert to 'new' if no interactions for > 24 hours
    else if (
      ['contacted', 'qualified', 'negotiation'].includes(lead.status) &&
      latestTime < twentyFourHoursAgo
    ) {
      await supabase.from('leads').update({
        status: 'new',
        last_interaction_at: null // Reset interaction SLA markers
      }).eq('id', lead.id);

      await supabase.from('interactions').insert([{
        lead_id: lead.id,
        type: 'note',
        content: 'System Automation: Reverted lead status to NEW due to 24-hour inactivity.'
      }]);
    }

    // --- EXTENDED SLA WORKFLOW AUTOMATION LAYER ---

    // Rule D: Inactivity Warning Escalation (Untouched for 3 days / 72 hours)
    if (
      ['new', 'contacted', 'qualified', 'negotiation'].includes(lead.status) &&
      latestTime < seventyTwoHoursAgo
    ) {
      // Check if alert already sent in last 24 hours to avoid spamming interaction notes
      const { data: recentAlerts } = await supabase
        .from('interactions')
        .select('id')
        .eq('lead_id', lead.id)
        .like('content', '%[CRITICAL SLA BREACH]%')
        .limit(1);

      if (!recentAlerts || recentAlerts.length === 0) {
        await supabase.from('interactions').insert([{
          lead_id: lead.id,
          type: 'note',
          content: `[CRITICAL SLA BREACH] Lead [${lead.name}] has been inactive for over 3 days (72 hours). System has alerted the general showroom manager for immediate inspection and reassignment.`
        }]);
      }
    }

    // Rule E: Hot Lead neglected Escalation (Touchless for > 1 hour)
    if (
      (lead.health === 'hot' || (lead.score && lead.score >= 80)) &&
      ['new', 'contacted'].includes(lead.status) &&
      latestTime < oneHourAgo
    ) {
      const { data: recentHotAlerts } = await supabase
        .from('interactions')
        .select('id')
        .eq('lead_id', lead.id)
        .like('content', '%[HOT LEAD ESCALATION]%')
        .limit(1);

      if (!recentHotAlerts || recentHotAlerts.length === 0) {
        await supabase.from('interactions').insert([{
          lead_id: lead.id,
          type: 'note',
          content: `[HOT LEAD ESCALATION] High-priority/hot lead [${lead.name}] has been unserviced for over 1 hour. Urgent sales callback is required immediately to avoid losing conversion momentum.`
        }]);
      }
    }

    // Rule F: High-Value Customer Premium Routing & Prioritization
    let isHighValue = false;
    try {
      if (lead.notes && lead.notes.startsWith('{')) {
        const parsed = JSON.parse(lead.notes);
        const vehicle = (parsed.vehicle || '').toLowerCase();
        const budget = (parsed.budget || '').toLowerCase();
        if (
          vehicle.includes('ioniq') ||
          vehicle.includes('tucson') ||
          budget.includes('₹20l') ||
          budget.includes('₹25l') ||
          budget.includes('₹30l')
        ) {
          isHighValue = true;
        }
      } else if (lead.notes && (lead.notes.toLowerCase().includes('ioniq') || lead.notes.toLowerCase().includes('tucson'))) {
        isHighValue = true;
      }
    } catch (e) {
      // safe fallback on string parsing
    }

    if (isHighValue && lead.priority !== 'high') {
      const updates: any = { priority: 'high' };
      let routeLog = '';

      if (seniorRep && lead.assigned_to !== seniorRep.id) {
        updates.assigned_to = seniorRep.id;
        routeLog = ` and auto-assigned to Senior Sales Advisor [${seniorRep.name}]`;
      }

      await supabase.from('leads').update(updates).eq('id', lead.id);

      await supabase.from('interactions').insert([{
        lead_id: lead.id,
        type: 'status_change',
        content: `[VIP AUTOMATION TRIGGER] Inbound analysis flagged high-value interest in premium vehicle model/budget. Upgraded lead priority to HIGH${routeLog}.`
      }]);
    }
  }
}

export async function addTask(leadId: string, title: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').insert([{
    lead_id: leadId,
    title,
    status: 'pending'
  }]);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function toggleTask(leadId: string, taskId: string, currentStatus: string) {
  const supabase = await createClient();
  const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function seedDefaultTasks(leadId: string, shouldRevalidate: boolean = false) {
  const supabase = await createClient();
  
  // Seed the standard extended checklist (all set to 'pending' by default!)
  const defaultTasks = [
    { lead_id: leadId, title: 'Send brochure & pricing', status: 'pending' },
    { lead_id: leadId, title: 'Arrange callback with finance', status: 'pending' },
    { lead_id: leadId, title: 'Schedule test drive', status: 'pending' },
    { lead_id: leadId, title: 'Follow up after test drive', status: 'pending' },
    { lead_id: leadId, title: 'Negotiate final pricing', status: 'pending' },
    { lead_id: leadId, title: 'Collect booking amount', status: 'pending' }
  ];

  const { data, error } = await supabase.from('tasks').insert(defaultTasks).select();
  if (error) throw new Error(error.message);

  if (shouldRevalidate) {
    revalidatePath(`/leads/${leadId}`);
  }
  return data || [];
}

export async function bulkUpdateLeads(leadIds: string[], assignedTo: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: assignedTo })
    .in('id', leadIds);

  if (error) throw new Error(error.message);

  // Add interaction history to log the reassignment
  const { SALES_REPS } = require("@/lib/constants/reps");
  const matchedRep = SALES_REPS.find((r: any) => r.id === assignedTo);
  const repName = matchedRep ? matchedRep.name : "Sales Advisor";
  
  for (const id of leadIds) {
    await supabase.from('interactions').insert([{
      lead_id: id,
      type: 'note',
      content: `Lead assigned to ${repName} via CRM bulk operations.`
    }]);
  }

  revalidatePath('/leads');
  revalidatePath('/dashboard');
}


/**
 * Archive converted/closed leads to the ledger.
 * Only leads with status 'converted' or 'lost' can be archived.
 * Soft-delete: sets archived=true — data is never destroyed.
 */
export async function archiveLeads(leadIds: string[], archivedBy: string) {
  const supabase = await createClient();

  const { data: targetLeads, error: fetchError } = await supabase
    .from('leads')
    .select('id, name, status')
    .in('id', leadIds);

  if (fetchError) throw new Error(fetchError.message);

  const eligible = (targetLeads || []).filter(
    (l: any) => l.status === 'converted' || l.status === 'lost' || l.status === 'completed'
  );

  if (eligible.length === 0) {
    throw new Error('No eligible leads. Only converted, completed, or lost leads can be archived to the ledger.');
  }

  const eligibleIds = eligible.map((l: any) => l.id);

  const { error } = await supabase
    .from('leads')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
      archived_by: archivedBy,
    })
    .in('id', eligibleIds);

  if (error) throw new Error(error.message);

  for (const lead of eligible) {
    await supabase.from('interactions').insert([{
      lead_id: lead.id,
      type: 'note',
      content: `Lead archived to Ledger. Status at archive: ${lead.status}.`,
    }]);
  }

  revalidatePath('/leads');
  revalidatePath('/ledger');
  revalidatePath('/dashboard');

  return { archived: eligibleIds.length, skipped: leadIds.length - eligibleIds.length };
}
