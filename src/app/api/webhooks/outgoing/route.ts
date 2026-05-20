import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import fs from 'fs';
import path from 'path';

const LOGS_FILE_PATH = path.join(process.cwd(), 'src/app/api/partner/automation/logs.json');

// Ensure parent directories and logs database exist
function appendLog(logEntry: any) {
  try {
    const dir = path.dirname(LOGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    let logs = [];
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const data = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
      logs = JSON.parse(data || '[]');
    }
    
    logs.unshift(logEntry); // Add to beginning of array
    // Cap logs at 50 to keep memory small
    if (logs.length > 50) {
      logs = logs.slice(0, 50);
    }
    
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write automation stats logs file', e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, recipient, channel = 'sms', message, triggerName } = body;

    if (!leadId || !message) {
      return NextResponse.json({ error: 'leadId and message are required.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get Lead profile details
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    // 2. Audit Outgoing Message directly in lead interaction history
    const interactionMsg = `[Automated Outbound ${channel.toUpperCase()}] triggered by event [${triggerName || 'manual'}].\nRecipient: ${recipient}\nContent: "${message}"`;
    
    await supabase.from('interactions').insert([
      {
        lead_id: leadId,
        type: 'email', // Maps standard UI icon
        content: interactionMsg
      }
    ]);

    // 3. Write dynamic execution details to local stats logs
    const logEntry = {
      id: Math.random().toString(36).substring(7),
      rule_name: `Flow Auto: ${triggerName || 'Outbound'}`,
      trigger_event: triggerName || 'followup.dispatch',
      channel: channel.toUpperCase(),
      trigger_offset_minutes: 0,
      recipient: lead.name,
      body: message,
      status: 'delivered', // simulated successful delivery
      created_at: new Date().toISOString()
    };

    appendLog(logEntry);

    return NextResponse.json({
      success: true,
      channel,
      recipient,
      message,
      logged: true
    }, { status: 200 });

  } catch (error) {
    console.error('Outbound webhook execution error:', error);
    return NextResponse.json({ error: 'Failed to process follow-up' }, { status: 500 });
  }
}
