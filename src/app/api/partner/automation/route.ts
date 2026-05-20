import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RULES_FILE_PATH = path.join(process.cwd(), 'src/app/api/partner/automation/rules.json');

// Ensure database file exists and load data
function getRules() {
  try {
    const dir = path.dirname(RULES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(RULES_FILE_PATH)) {
      // Seed default industry-standard rules
      const defaultRules = [
        {
          id: 'rule-booking-confirm',
          rule_name: 'Showroom Booking Confirmation Loop',
          trigger_event: 'booking.completed',
          channel: 'sms',
          template_id: 'temp-booking-welcome',
          trigger_offset_minutes: 0,
          is_active: true,
          total_fired: 12,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rule-sla-warn',
          rule_name: 'Hot Lead SLA Overdue Escalator',
          trigger_event: 'booking.reminder',
          channel: 'sms',
          template_id: 'temp-hot-sla-warn',
          trigger_offset_minutes: 15,
          is_active: true,
          total_fired: 4,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      fs.writeFileSync(RULES_FILE_PATH, JSON.stringify(defaultRules, null, 2), 'utf-8');
      return defaultRules;
    }

    const data = fs.readFileSync(RULES_FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Failed to read automation rules file', e);
    return [];
  }
}

function saveRules(rules: any[]) {
  try {
    fs.writeFileSync(RULES_FILE_PATH, JSON.stringify(rules, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write automation rules file', e);
  }
}

export async function GET() {
  const rules = getRules();
  // Return wrapper with "data" field expected by hook
  return NextResponse.json({ success: true, data: rules }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rule_name, trigger_event, channel, template_id, trigger_offset_minutes } = body;

    if (!rule_name || !template_id) {
      return NextResponse.json({ error: 'rule_name and template_id are required.' }, { status: 400 });
    }

    const rules = getRules();
    const newRule = {
      id: `rule-${Math.random().toString(36).substring(7)}`,
      rule_name,
      trigger_event,
      channel,
      template_id,
      trigger_offset_minutes: parseInt(trigger_offset_minutes) || 0,
      is_active: true,
      total_fired: 0,
      created_at: new Date().toISOString()
    };

    rules.unshift(newRule);
    saveRules(rules);

    return NextResponse.json({ success: true, data: newRule }, { status: 201 });
  } catch (e) {
    console.error('Failed to create custom automation rule', e);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
