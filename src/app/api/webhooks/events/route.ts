import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, leadId, metadata = {} } = body;

    if (!eventType || !leadId) {
      return NextResponse.json({ error: 'eventType and leadId are required.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch Lead Details for name and contact info context
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead profile not found.' }, { status: 404 });
    }

    // 2. Audit Event in Chronological Timeline Log
    let auditMsg = `System Event Raised: [${eventType.toUpperCase()}].`;
    if (eventType === 'lead.created') {
      auditMsg += ` Lead Ingested into CRM. Source: ${lead.source}. Score: ${lead.score}.`;
    } else if (eventType === 'status.changed') {
      auditMsg += ` Status moved to: ${lead.status.toUpperCase()}.`;
    } else if (eventType === 'lead.reassigned') {
      auditMsg += ` Reassigned to owner UUID: ${lead.assigned_to}.`;
    } else if (metadata.description) {
      auditMsg += ` Description: ${metadata.description}`;
    }

    await supabase.from('interactions').insert([
      {
        lead_id: leadId,
        type: 'status_change',
        content: auditMsg
      }
    ]);

    // 3. Automation Rules Evaluator Link
    // We will automatically dispatch outbound reminders on corresponding event types
    let autoTrigger = false;
    let channel: 'sms' | 'whatsapp' | 'email' = 'sms';
    let templateMsg = '';

    if (eventType === 'lead.created') {
      autoTrigger = true;
      channel = 'sms';
      templateMsg = `Welcome to HSR Motors, ${lead.name}! We have received your inquiry. One of our sales advisors will connect with you shortly regarding vehicle options.`;
    } else if (eventType === 'status.changed' && lead.status === 'completed') {
      autoTrigger = true;
      channel = 'whatsapp';
      templateMsg = `Dear ${lead.name}, congratulations on booking your vehicle with HSR Motors! Your invoice and booking details have been sent. Welcome to the HSR family!`;
    } else if (eventType === 'test_drive.booked') {
      autoTrigger = true;
      channel = 'email';
      templateMsg = `Hi ${lead.name}, your Hyundai test drive is confirmed! Please bring a valid driving license for the demo session. See you soon!`;
    } else if (eventType === 'followup.overdue') {
      autoTrigger = true;
      channel = 'sms';
      templateMsg = `Alert: Follow-up is outstanding for customer ${lead.name}. Representative, please verify schedule parameters immediately.`;
    }

    if (autoTrigger) {
      const origin = new URL(request.url).origin;
      try {
        await fetch(`${origin}/api/webhooks/outgoing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: lead.id,
            recipient: lead.phone || lead.email || 'Advisor Chat',
            channel,
            message: templateMsg,
            triggerName: eventType
          })
        });
      } catch (e) {
        console.error('Failed to trigger outbound webhook', e);
      }
    }

    return NextResponse.json({
      success: true,
      event: eventType,
      leadId,
      processed: autoTrigger
    }, { status: 200 });

  } catch (error) {
    console.error('Event trigger processing error:', error);
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }
}
